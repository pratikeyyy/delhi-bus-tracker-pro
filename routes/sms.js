const express = require('express');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');
const Stop = require('../models/Stop');
const etaService = require('../services/etaService');
const fareService = require('../services/fareService');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize Twilio client (optional for development)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('Twilio initialization failed - SMS features disabled:', error.message);
  }
}

// SMS webhook endpoint for incoming messages
router.post('/webhook',
  [
    body('From').notEmpty().withMessage('Phone number required'),
    body('Body').notEmpty().withMessage('Message body required')
  ],
  async (req, res) => {
    try {
      const { From: phoneNumber, Body: message } = req.body;
      
      logger.info(`SMS received from ${phoneNumber}: ${message}`);
      
      const response = await processIncomingSMS(phoneNumber, message.trim());
      
      // Send response via Twilio
      if (response) {
        await sendSMS(phoneNumber, response);
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      logger.error('SMS webhook error:', error);
      res.status(500).send('Error processing SMS');
    }
  }
);

// Send ETA information via SMS
router.post('/send-eta',
  [
    body('phoneNumber').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Valid phone number required'),
    body('stopId').isMongoId().withMessage('Valid stop ID required'),
    body('language').optional().isIn(['en', 'hi']).withMessage('Invalid language')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { phoneNumber, stopId, language = 'en' } = req.body;
      
      const stop = await Stop.findById(stopId);
      if (!stop) {
        return res.status(404).json({
          success: false,
          message: 'Stop not found'
        });
      }

      const buses = await etaService.calculateMultipleBusETA(stopId, 3);
      const message = formatETAMessage(stop, buses, language);
      
      await sendSMS(phoneNumber, message);
      
      logger.info(`ETA SMS sent to ${phoneNumber} for stop ${stop.name}`);
      
      res.json({
        success: true,
        message: 'ETA information sent via SMS'
      });

    } catch (error) {
      logger.error('Send ETA SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send ETA SMS'
      });
    }
  }
);

// Process incoming SMS messages
async function processIncomingSMS(phoneNumber, message) {
  try {
    const messageLower = message.toLowerCase();
    
    // ETA command: "ETA <stop_name>" or "ETA <stop_id>"
    if (messageLower.startsWith('eta ')) {
      const query = message.substring(4).trim();
      return await handleETAQuery(query);
    }
    
    // Fare command: "FARE <from> TO <to>"
    if (messageLower.includes('fare') && messageLower.includes(' to ')) {
      return await handleFareQuery(message);
    }
    
    // Route command: "ROUTE <from> TO <to>"
    if (messageLower.includes('route') && messageLower.includes(' to ')) {
      return await handleRouteQuery(message);
    }
    
    // Help command
    if (messageLower === 'help' || messageLower === 'h') {
      return getHelpMessage();
    }
    
    // Default response for unrecognized commands
    return `Invalid command. Send "HELP" for available commands.\n\nAvailable:\n• ETA <stop_name>\n• FARE <from> TO <to>\n• ROUTE <from> TO <to>`;
    
  } catch (error) {
    logger.error('Process SMS error:', error);
    return 'Sorry, there was an error processing your request. Please try again.';
  }
}

// Handle ETA queries
async function handleETAQuery(query) {
  try {
    // Try to find stop by name or ID
    let stop = null;
    
    // First try exact stopId match
    if (query.match(/^[A-Z0-9]+$/)) {
      stop = await Stop.findOne({ stopId: query.toUpperCase(), isActive: true });
    }
    
    // If not found, try name search
    if (!stop) {
      stop = await Stop.findOne({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'nameTranslations.hi': { $regex: query, $options: 'i' } }
        ],
        isActive: true
      });
    }
    
    if (!stop) {
      return `Stop "${query}" not found. Please check the stop name or ID.`;
    }
    
    const buses = await etaService.calculateMultipleBusETA(stop._id, 3);
    return formatETAMessage(stop, buses, 'en');
    
  } catch (error) {
    logger.error('Handle ETA query error:', error);
    return 'Error getting ETA information. Please try again.';
  }
}

// Handle fare queries
async function handleFareQuery(message) {
  try {
    const parts = message.toLowerCase().split(' to ');
    if (parts.length !== 2) {
      return 'Invalid format. Use: FARE <from_stop> TO <to_stop>';
    }
    
    const fromQuery = parts[0].replace('fare ', '').trim();
    const toQuery = parts[1].trim();
    
    // Find stops
    const fromStop = await findStopByQuery(fromQuery);
    const toStop = await findStopByQuery(toQuery);
    
    if (!fromStop) {
      return `From stop "${fromQuery}" not found.`;
    }
    
    if (!toStop) {
      return `To stop "${toQuery}" not found.`;
    }
    
    const fareData = await fareService.calculateMultiRouteFare(fromStop._id, toStop._id);
    
    if (fareData.options.length === 0) {
      return `No routes found between ${fromStop.name} and ${toStop.name}.`;
    }
    
    return formatFareMessage(fareData);
    
  } catch (error) {
    logger.error('Handle fare query error:', error);
    return 'Error calculating fare. Please try again.';
  }
}

// Handle route queries
async function handleRouteQuery(message) {
  try {
    const parts = message.toLowerCase().split(' to ');
    if (parts.length !== 2) {
      return 'Invalid format. Use: ROUTE <from_stop> TO <to_stop>';
    }
    
    const fromQuery = parts[0].replace('route ', '').trim();
    const toQuery = parts[1].trim();
    
    const fromStop = await findStopByQuery(fromQuery);
    const toStop = await findStopByQuery(toQuery);
    
    if (!fromStop || !toStop) {
      return 'One or both stops not found. Please check stop names.';
    }
    
    const fareData = await fareService.calculateMultiRouteFare(fromStop._id, toStop._id);
    
    if (fareData.options.length === 0) {
      return `No routes found between ${fromStop.name} and ${toStop.name}.`;
    }
    
    return formatRouteMessage(fareData);
    
  } catch (error) {
    logger.error('Handle route query error:', error);
    return 'Error finding routes. Please try again.';
  }
}

// Find stop by query (name or ID)
async function findStopByQuery(query) {
  // Try stopId first
  if (query.match(/^[A-Z0-9]+$/)) {
    const stop = await Stop.findOne({ stopId: query.toUpperCase(), isActive: true });
    if (stop) return stop;
  }
  
  // Try name search
  return await Stop.findOne({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { 'nameTranslations.hi': { $regex: query, $options: 'i' } }
    ],
    isActive: true
  });
}

// Format ETA message
function formatETAMessage(stop, buses, language = 'en') {
  const stopName = language === 'hi' && stop.nameTranslations?.hi ? 
    stop.nameTranslations.hi : stop.name;
  
  if (buses.length === 0) {
    return language === 'hi' ? 
      `${stopName} पर कोई बस उपलब्ध नहीं है।` :
      `No buses available at ${stopName}.`;
  }
  
  let message = language === 'hi' ? 
    `${stopName} पर बसों का समय:\n` :
    `Bus timings at ${stopName}:\n`;
  
  buses.forEach((bus, index) => {
    if (language === 'hi') {
      message += `${index + 1}. बस ${bus.busNumber}: ${bus.eta} मिनट\n`;
    } else {
      message += `${index + 1}. Bus ${bus.busNumber}: ${bus.eta} min\n`;
    }
  });
  
  return message.trim();
}

// Format fare message
function formatFareMessage(fareData) {
  const { fromStop, toStop, options } = fareData;
  
  let message = `Fare from ${fromStop.name} to ${toStop.name}:\n`;
  
  options.slice(0, 3).forEach((option, index) => {
    message += `${index + 1}. Route ${option.routeNumber}: ₹${option.fare} (${option.distance}km)\n`;
  });
  
  return message.trim();
}

// Format route message
function formatRouteMessage(fareData) {
  const { fromStop, toStop, options } = fareData;
  
  let message = `Routes from ${fromStop.name} to ${toStop.name}:\n`;
  
  options.slice(0, 3).forEach((option, index) => {
    message += `${index + 1}. ${option.routeNumber}: ${option.stops} stops, ₹${option.fare}\n`;
  });
  
  return message.trim();
}

// Get help message
function getHelpMessage() {
  return `Bus Tracker SMS Commands:

ETA <stop_name> - Get bus arrival times
FARE <from> TO <to> - Calculate fare
ROUTE <from> TO <to> - Find routes

Examples:
• ETA Station
• FARE Station TO College  
• ROUTE Market TO Hospital

Send HELP for this message.`;
}

// Send SMS using Twilio
async function sendSMS(phoneNumber, message) {
  try {
    if (!twilioClient || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio credentials not configured, SMS not sent');
      console.log(`[DEV MODE] SMS would be sent to ${phoneNumber}: ${message}`);
      return { sid: 'dev-mode-' + Date.now() };
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    logger.info(`SMS sent successfully`, { 
      messageId: result.sid, 
      to: phoneNumber 
    });
    
    return result;
    
  } catch (error) {
    logger.error('Send SMS error:', error);
    throw error;
  }
}

// Bulk SMS for alerts
router.post('/send-alert',
  [
    body('phoneNumbers').isArray().withMessage('Phone numbers array required'),
    body('message').trim().isLength({ min: 1, max: 1600 }).withMessage('Message required (max 1600 chars)'),
    body('type').optional().isIn(['delay', 'disruption', 'emergency']).withMessage('Invalid alert type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { phoneNumbers, message, type = 'alert' } = req.body;
      
      const results = [];
      
      for (const phoneNumber of phoneNumbers) {
        try {
          await sendSMS(phoneNumber, message);
          results.push({ phoneNumber, success: true });
        } catch (error) {
          results.push({ phoneNumber, success: false, error: error.message });
        }
      }
      
      logger.info(`Bulk SMS alert sent`, { 
        type, 
        totalRecipients: phoneNumbers.length,
        successful: results.filter(r => r.success).length
      });
      
      res.json({
        success: true,
        message: 'Bulk SMS sent',
        data: { results }
      });

    } catch (error) {
      logger.error('Bulk SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk SMS'
      });
    }
  }
);

module.exports = router;
