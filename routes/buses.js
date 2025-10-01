const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const etaService = require('../services/etaService');
const fareService = require('../services/fareService');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all buses with filtering and pagination
router.get('/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['active', 'maintenance', 'inactive', 'retired']).withMessage('Invalid status'),
    query('route').optional().isMongoId().withMessage('Invalid route ID'),
    query('online').optional().isBoolean().withMessage('Online must be boolean')
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

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.route) filter.assignedRoute = req.query.route;
      if (req.query.online !== undefined) filter.isOnline = req.query.online === 'true';

      const buses = await Bus.find(filter)
        .populate('assignedRoute', 'routeNumber name')
        .populate('assignedDriver', 'name phone')
        .populate('currentTrip', 'status scheduledStartTime')
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .sort({ busNumber: 1 });

      const total = await Bus.countDocuments(filter);

      res.json({
        success: true,
        data: {
          buses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get buses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch buses'
      });
    }
  }
);

// Get specific bus details
router.get('/:busId',
  optionalAuth,
  async (req, res) => {
    try {
      const { busId } = req.params;
      
      const bus = await Bus.findById(busId)
        .populate('assignedRoute')
        .populate('assignedDriver', 'name phone email')
        .populate('currentTrip');

      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      res.json({
        success: true,
        data: { bus }
      });

    } catch (error) {
      logger.error('Get bus details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bus details'
      });
    }
  }
);

// Get bus ETA to specific stop
router.get('/:busId/eta/:stopId',
  async (req, res) => {
    try {
      const { busId, stopId } = req.params;
      
      const eta = await etaService.calculateETA(busId, stopId);
      
      res.json({
        success: true,
        data: { eta }
      });

    } catch (error) {
      logger.error('Get bus ETA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate ETA'
      });
    }
  }
);

// Get buses serving a specific stop
router.get('/stop/:stopId/buses',
  async (req, res) => {
    try {
      const { stopId } = req.params;
      
      const etas = await etaService.calculateMultipleBusETA(stopId);
      
      res.json({
        success: true,
        data: { buses: etas }
      });

    } catch (error) {
      logger.error('Get stop buses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch buses for stop'
      });
    }
  }
);

// Create new bus (Admin only)
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  [
    body('busNumber').trim().notEmpty().withMessage('Bus number is required'),
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('capacity').isInt({ min: 10, max: 100 }).withMessage('Capacity must be 10-100'),
    body('type').optional().isIn(['city', 'intercity', 'express', 'deluxe', 'ac', 'non-ac']).withMessage('Invalid bus type'),
    body('assignedRoute').optional().isMongoId().withMessage('Invalid route ID'),
    body('assignedDriver').optional().isMongoId().withMessage('Invalid driver ID')
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

      const busData = req.body;
      const bus = new Bus(busData);
      await bus.save();

      logger.info(`New bus created: ${bus.busNumber}`, { busId: bus._id, adminId: req.user.id });

      res.status(201).json({
        success: true,
        message: 'Bus created successfully',
        data: { bus }
      });

    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Bus number or registration number already exists'
        });
      }
      
      logger.error('Create bus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bus'
      });
    }
  }
);

// Update bus (Admin only)
router.put('/:busId',
  authenticateToken,
  requireRole(['admin']),
  [
    body('busNumber').optional().trim().notEmpty().withMessage('Bus number cannot be empty'),
    body('capacity').optional().isInt({ min: 10, max: 100 }).withMessage('Capacity must be 10-100'),
    body('status').optional().isIn(['active', 'maintenance', 'inactive', 'retired']).withMessage('Invalid status'),
    body('assignedRoute').optional().isMongoId().withMessage('Invalid route ID'),
    body('assignedDriver').optional().isMongoId().withMessage('Invalid driver ID')
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

      const { busId } = req.params;
      const updateData = req.body;

      const bus = await Bus.findByIdAndUpdate(busId, updateData, { 
        new: true,
        runValidators: true 
      });

      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      logger.info(`Bus updated: ${bus.busNumber}`, { busId, adminId: req.user.id });

      res.json({
        success: true,
        message: 'Bus updated successfully',
        data: { bus }
      });

    } catch (error) {
      logger.error('Update bus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update bus'
      });
    }
  }
);

// Delete bus (Admin only)
router.delete('/:busId',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { busId } = req.params;
      
      const bus = await Bus.findByIdAndDelete(busId);
      
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      logger.info(`Bus deleted: ${bus.busNumber}`, { busId, adminId: req.user.id });

      res.json({
        success: true,
        message: 'Bus deleted successfully'
      });

    } catch (error) {
      logger.error('Delete bus error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete bus'
      });
    }
  }
);

// Get bus location history (Admin/Driver only)
router.get('/:busId/location-history',
  authenticateToken,
  requireRole(['admin', 'driver']),
  [
    query('from').optional().isISO8601().withMessage('Invalid from date'),
    query('to').optional().isISO8601().withMessage('Invalid to date'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000')
  ],
  async (req, res) => {
    try {
      const { busId } = req.params;
      const { from, to, limit = 100 } = req.query;

      // This would typically query a separate location history collection
      // For now, return mock data
      const locationHistory = {
        busId,
        period: { from, to },
        locations: [
          {
            latitude: 28.6139,
            longitude: 77.2090,
            timestamp: new Date(),
            speed: 25,
            heading: 180
          }
        ]
      };

      res.json({
        success: true,
        data: locationHistory
      });

    } catch (error) {
      logger.error('Get location history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch location history'
      });
    }
  }
);

module.exports = router;
