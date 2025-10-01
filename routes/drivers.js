const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get driver dashboard data
router.get('/dashboard',
  authenticateToken,
  requireRole(['driver']),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      
      // Get assigned bus
      const assignedBus = await Bus.findOne({ assignedDriver: driverId })
        .populate('assignedRoute', 'routeNumber name')
        .populate('currentTrip');

      // Get current trip details
      let currentTrip = null;
      if (assignedBus && assignedBus.currentTrip) {
        currentTrip = await Trip.findById(assignedBus.currentTrip)
          .populate('route', 'routeNumber name')
          .populate('currentStop nextStop', 'name location');
      }

      // Get recent trips
      const recentTrips = await Trip.find({ driver: driverId })
        .populate('route', 'routeNumber name')
        .populate('bus', 'busNumber')
        .sort({ scheduledStartTime: -1 })
        .limit(5)
        .select('status scheduledStartTime actualStartTime totalPassengers totalRevenue');

      // Calculate stats
      const stats = {
        totalTrips: await Trip.countDocuments({ driver: driverId, status: 'completed' }),
        totalRevenue: await Trip.aggregate([
          { $match: { driver: driverId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
        ]).then(result => result[0]?.total || 0),
        averageRating: 4.2, // Mock data
        onTimePercentage: 85 // Mock data
      };

      res.json({
        success: true,
        data: {
          driver: req.user,
          assignedBus,
          currentTrip,
          recentTrips,
          stats
        }
      });

    } catch (error) {
      logger.error('Driver dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard'
      });
    }
  }
);

// Start trip
router.post('/trips/start',
  authenticateToken,
  requireRole(['driver']),
  [
    body('tripId').isMongoId().withMessage('Valid trip ID required')
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

      const { tripId } = req.body;
      const driverId = req.user.id;

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      if (trip.driver.toString() !== driverId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized for this trip'
        });
      }

      if (trip.status !== 'scheduled') {
        return res.status(400).json({
          success: false,
          message: 'Trip cannot be started'
        });
      }

      // Update trip status
      trip.status = 'in_progress';
      trip.actualStartTime = new Date();
      await trip.save();

      // Update bus status
      await Bus.findByIdAndUpdate(trip.bus, {
        currentTrip: tripId,
        isOnline: true
      });

      logger.info(`Trip started by driver ${driverId}`, { tripId });

      res.json({
        success: true,
        message: 'Trip started successfully',
        data: { trip }
      });

    } catch (error) {
      logger.error('Start trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start trip'
      });
    }
  }
);

// End trip
router.post('/trips/end',
  authenticateToken,
  requireRole(['driver']),
  [
    body('tripId').isMongoId().withMessage('Valid trip ID required'),
    body('endLocation').optional().isObject().withMessage('End location must be object'),
    body('fuelConsumed').optional().isFloat({ min: 0 }).withMessage('Fuel consumed must be positive'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
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

      const { tripId, endLocation, fuelConsumed, notes } = req.body;
      const driverId = req.user.id;

      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      if (trip.driver.toString() !== driverId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized for this trip'
        });
      }

      if (trip.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Trip is not in progress'
        });
      }

      // Update trip
      trip.status = 'completed';
      trip.actualEndTime = new Date();
      if (fuelConsumed) trip.fuelConsumed = fuelConsumed;
      if (notes) trip.notes = notes;
      
      // Calculate average delay
      trip.averageDelay = trip.calculateAverageDelay();
      
      await trip.save();

      // Update bus status
      await Bus.findByIdAndUpdate(trip.bus, {
        $unset: { currentTrip: 1 },
        isOnline: false
      });

      logger.info(`Trip completed by driver ${driverId}`, { tripId });

      res.json({
        success: true,
        message: 'Trip completed successfully',
        data: { trip }
      });

    } catch (error) {
      logger.error('End trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end trip'
      });
    }
  }
);

// Update stop arrival/departure
router.post('/trips/:tripId/stops/:stopId/arrival',
  authenticateToken,
  requireRole(['driver']),
  [
    body('passengersBoarded').optional().isInt({ min: 0 }).withMessage('Passengers boarded must be non-negative'),
    body('passengersAlighted').optional().isInt({ min: 0 }).withMessage('Passengers alighted must be non-negative')
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

      const { tripId, stopId } = req.params;
      const { passengersBoarded = 0, passengersAlighted = 0 } = req.body;
      const driverId = req.user.id;

      const trip = await Trip.findById(tripId);
      if (!trip || trip.driver.toString() !== driverId) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found or unauthorized'
        });
      }

      // Find stop in trip progress
      const stopProgress = trip.stopProgress.find(sp => sp.stop.toString() === stopId);
      if (!stopProgress) {
        return res.status(404).json({
          success: false,
          message: 'Stop not found in trip'
        });
      }

      // Update stop arrival
      stopProgress.actualArrival = new Date();
      stopProgress.passengersBoarded = passengersBoarded;
      stopProgress.passengersAlighted = passengersAlighted;

      // Calculate delay
      if (stopProgress.scheduledArrival) {
        const delay = (stopProgress.actualArrival - stopProgress.scheduledArrival) / (1000 * 60);
        stopProgress.delay = Math.max(0, delay);
      }

      await trip.save();

      logger.info(`Stop arrival recorded`, { tripId, stopId, driverId });

      res.json({
        success: true,
        message: 'Stop arrival recorded',
        data: { stopProgress }
      });

    } catch (error) {
      logger.error('Record stop arrival error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record stop arrival'
      });
    }
  }
);

// Report issue/alert
router.post('/alerts',
  authenticateToken,
  requireRole(['driver']),
  [
    body('type').isIn(['delay', 'breakdown', 'accident', 'route_deviation', 'overcrowding']).withMessage('Invalid alert type'),
    body('message').trim().isLength({ min: 5, max: 500 }).withMessage('Message must be 5-500 characters'),
    body('location').optional().isObject().withMessage('Location must be object'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity')
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

      const { type, message, location, severity = 'medium' } = req.body;
      const driverId = req.user.id;

      // Get driver's current trip
      const bus = await Bus.findOne({ assignedDriver: driverId });
      if (!bus || !bus.currentTrip) {
        return res.status(400).json({
          success: false,
          message: 'No active trip found'
        });
      }

      const trip = await Trip.findById(bus.currentTrip);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      // Add alert to trip
      const alert = {
        type,
        message,
        location: location || bus.currentLocation,
        severity,
        timestamp: new Date(),
        resolved: false
      };

      trip.alerts.push(alert);
      await trip.save();

      // Broadcast alert to relevant parties
      const { broadcastAlert } = require('../services/socketService');
      broadcastAlert('driver_alert', {
        alertId: alert._id,
        tripId: trip._id,
        busId: bus._id,
        driverId,
        type,
        message,
        severity,
        location: alert.location
      });

      logger.warn(`Driver alert reported`, { 
        driverId, 
        tripId: trip._id, 
        type, 
        severity,
        message 
      });

      res.json({
        success: true,
        message: 'Alert reported successfully',
        data: { alert }
      });

    } catch (error) {
      logger.error('Report alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report alert'
      });
    }
  }
);

// Get driver performance metrics
router.get('/performance',
  authenticateToken,
  requireRole(['driver']),
  [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid period')
  ],
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const { period = 'month' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get performance metrics
      const trips = await Trip.find({
        driver: driverId,
        scheduledStartTime: { $gte: startDate },
        status: 'completed'
      });

      const metrics = {
        totalTrips: trips.length,
        onTimeTrips: trips.filter(t => t.averageDelay <= 5).length,
        totalRevenue: trips.reduce((sum, t) => sum + (t.totalRevenue || 0), 0),
        totalPassengers: trips.reduce((sum, t) => sum + (t.totalPassengers || 0), 0),
        averageDelay: trips.length > 0 ? 
          trips.reduce((sum, t) => sum + (t.averageDelay || 0), 0) / trips.length : 0,
        fuelEfficiency: trips.length > 0 ?
          trips.reduce((sum, t) => sum + (t.fuelConsumed || 0), 0) / trips.length : 0,
        alertsReported: trips.reduce((sum, t) => sum + t.alerts.length, 0)
      };

      metrics.onTimePercentage = metrics.totalTrips > 0 ? 
        (metrics.onTimeTrips / metrics.totalTrips) * 100 : 0;

      res.json({
        success: true,
        data: {
          period,
          dateRange: { from: startDate, to: now },
          metrics
        }
      });

    } catch (error) {
      logger.error('Get performance metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get performance metrics'
      });
    }
  }
);

module.exports = router;
