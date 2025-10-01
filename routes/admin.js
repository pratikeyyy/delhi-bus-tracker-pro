const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Trip = require('../models/Trip');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Admin dashboard analytics
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fleet statistics
      const fleetStats = {
        totalBuses: await Bus.countDocuments(),
        activeBuses: await Bus.countDocuments({ status: 'active' }),
        onlineBuses: await Bus.countDocuments({ isOnline: true }),
        maintenanceBuses: await Bus.countDocuments({ status: 'maintenance' })
      };

      // Route statistics
      const routeStats = {
        totalRoutes: await Route.countDocuments(),
        activeRoutes: await Route.countDocuments({ isActive: true }),
        totalStops: await Stop.countDocuments(),
        activeStops: await Stop.countDocuments({ isActive: true })
      };

      // Trip statistics
      const tripStats = {
        todayTrips: await Trip.countDocuments({ 
          scheduledStartTime: { $gte: today }
        }),
        activeTrips: await Trip.countDocuments({ status: 'in_progress' }),
        completedTripsToday: await Trip.countDocuments({
          scheduledStartTime: { $gte: today },
          status: 'completed'
        }),
        monthlyRevenue: await Trip.aggregate([
          {
            $match: {
              scheduledStartTime: { $gte: thisMonth },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalRevenue' }
            }
          }
        ]).then(result => result[0]?.total || 0)
      };

      // User statistics
      const userStats = {
        totalUsers: await User.countDocuments(),
        passengers: await User.countDocuments({ role: 'passenger' }),
        drivers: await User.countDocuments({ role: 'driver' }),
        admins: await User.countDocuments({ role: 'admin' }),
        activeUsers: await User.countDocuments({ 
          lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      };

      // Recent alerts
      const recentAlerts = await Trip.aggregate([
        { $unwind: '$alerts' },
        { $match: { 'alerts.resolved': false } },
        { $sort: { 'alerts.timestamp': -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'buses',
            localField: 'bus',
            foreignField: '_id',
            as: 'busInfo'
          }
        },
        {
          $project: {
            alertId: '$alerts._id',
            type: '$alerts.type',
            message: '$alerts.message',
            severity: '$alerts.severity',
            timestamp: '$alerts.timestamp',
            busNumber: { $arrayElemAt: ['$busInfo.busNumber', 0] }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          fleetStats,
          routeStats,
          tripStats,
          userStats,
          recentAlerts,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      logger.error('Admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard'
      });
    }
  }
);

// Fleet management - Get all buses with detailed info
router.get('/fleet',
  authenticateToken,
  requireRole(['admin']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['active', 'maintenance', 'inactive', 'retired']).withMessage('Invalid status'),
    query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term required')
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
      if (req.query.search) {
        filter.$or = [
          { busNumber: { $regex: req.query.search, $options: 'i' } },
          { registrationNumber: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const buses = await Bus.find(filter)
        .populate('assignedRoute', 'routeNumber name')
        .populate('assignedDriver', 'name phone email')
        .populate('currentTrip', 'status scheduledStartTime')
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
      logger.error('Get fleet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fleet data'
      });
    }
  }
);

// Driver management
router.get('/drivers',
  authenticateToken,
  requireRole(['admin']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
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

      const filter = { role: 'driver' };
      if (req.query.status === 'active') filter.isActive = true;
      if (req.query.status === 'inactive') filter.isActive = false;

      const drivers = await User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 });

      // Get assigned buses for each driver
      const driversWithBuses = await Promise.all(
        drivers.map(async (driver) => {
          const assignedBus = await Bus.findOne({ assignedDriver: driver._id })
            .populate('assignedRoute', 'routeNumber name');
          
          return {
            ...driver.toObject(),
            assignedBus
          };
        })
      );

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: {
          drivers: driversWithBuses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get drivers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get drivers data'
      });
    }
  }
);

// Route management
router.get('/routes',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const routes = await Route.find()
        .populate('origin destination', 'name location')
        .populate('stops.stop', 'name location')
        .sort({ routeNumber: 1 });

      // Get bus count for each route
      const routesWithStats = await Promise.all(
        routes.map(async (route) => {
          const busCount = await Bus.countDocuments({ assignedRoute: route._id });
          const activeBusCount = await Bus.countDocuments({ 
            assignedRoute: route._id, 
            status: 'active' 
          });
          
          return {
            ...route.toObject(),
            busCount,
            activeBusCount
          };
        })
      );

      res.json({
        success: true,
        data: { routes: routesWithStats }
      });

    } catch (error) {
      logger.error('Get routes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get routes data'
      });
    }
  }
);

// Trip monitoring
router.get('/trips/active',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const activeTrips = await Trip.find({ status: 'in_progress' })
        .populate('bus', 'busNumber currentLocation')
        .populate('route', 'routeNumber name')
        .populate('driver', 'name phone')
        .populate('currentStop nextStop', 'name location')
        .sort({ scheduledStartTime: 1 });

      res.json({
        success: true,
        data: { trips: activeTrips }
      });

    } catch (error) {
      logger.error('Get active trips error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active trips'
      });
    }
  }
);

// Analytics and reports
router.get('/analytics/performance',
  authenticateToken,
  requireRole(['admin']),
  [
    query('period').optional().isIn(['day', 'week', 'month', 'quarter']).withMessage('Invalid period'),
    query('routeId').optional().isMongoId().withMessage('Invalid route ID')
  ],
  async (req, res) => {
    try {
      const { period = 'month', routeId } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      const matchFilter = {
        scheduledStartTime: { $gte: startDate },
        status: 'completed'
      };
      
      if (routeId) matchFilter.route = routeId;

      // Performance analytics
      const analytics = await Trip.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            totalRevenue: { $sum: '$totalRevenue' },
            totalPassengers: { $sum: '$totalPassengers' },
            averageDelay: { $avg: '$averageDelay' },
            onTimeTrips: {
              $sum: {
                $cond: [{ $lte: ['$averageDelay', 5] }, 1, 0]
              }
            }
          }
        }
      ]);

      const result = analytics[0] || {
        totalTrips: 0,
        totalRevenue: 0,
        totalPassengers: 0,
        averageDelay: 0,
        onTimeTrips: 0
      };

      result.onTimePercentage = result.totalTrips > 0 ? 
        (result.onTimeTrips / result.totalTrips) * 100 : 0;

      // Route performance breakdown
      const routePerformance = await Trip.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$route',
            trips: { $sum: 1 },
            revenue: { $sum: '$totalRevenue' },
            passengers: { $sum: '$totalPassengers' },
            avgDelay: { $avg: '$averageDelay' }
          }
        },
        {
          $lookup: {
            from: 'routes',
            localField: '_id',
            foreignField: '_id',
            as: 'routeInfo'
          }
        },
        {
          $project: {
            routeNumber: { $arrayElemAt: ['$routeInfo.routeNumber', 0] },
            routeName: { $arrayElemAt: ['$routeInfo.name', 0] },
            trips: 1,
            revenue: 1,
            passengers: 1,
            avgDelay: 1
          }
        },
        { $sort: { revenue: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          period,
          dateRange: { from: startDate, to: now },
          overall: result,
          routeBreakdown: routePerformance
        }
      });

    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics'
      });
    }
  }
);

// System alerts management
router.get('/alerts',
  authenticateToken,
  requireRole(['admin']),
  [
    query('resolved').optional().isBoolean().withMessage('Resolved must be boolean'),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity')
  ],
  async (req, res) => {
    try {
      const { resolved, severity } = req.query;
      
      const matchFilter = {};
      if (resolved !== undefined) matchFilter['alerts.resolved'] = resolved === 'true';
      if (severity) matchFilter['alerts.severity'] = severity;

      const alerts = await Trip.aggregate([
        { $unwind: '$alerts' },
        { $match: matchFilter },
        { $sort: { 'alerts.timestamp': -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: 'buses',
            localField: 'bus',
            foreignField: '_id',
            as: 'busInfo'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'driver',
            foreignField: '_id',
            as: 'driverInfo'
          }
        },
        {
          $project: {
            _id: '$alerts._id',
            tripId: '$_id',
            type: '$alerts.type',
            message: '$alerts.message',
            severity: '$alerts.severity',
            timestamp: '$alerts.timestamp',
            resolved: '$alerts.resolved',
            location: '$alerts.location',
            busNumber: { $arrayElemAt: ['$busInfo.busNumber', 0] },
            driverName: { $arrayElemAt: ['$driverInfo.name', 0] }
          }
        }
      ]);

      res.json({
        success: true,
        data: { alerts }
      });

    } catch (error) {
      logger.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alerts'
      });
    }
  }
);

// Resolve alert
router.put('/alerts/:alertId/resolve',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      
      const result = await Trip.updateOne(
        { 'alerts._id': alertId },
        { 
          $set: { 
            'alerts.$.resolved': true,
            'alerts.$.resolvedAt': new Date(),
            'alerts.$.resolvedBy': req.user.id
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Alert not found'
        });
      }

      logger.info(`Alert resolved by admin`, { alertId, adminId: req.user.id });

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });

    } catch (error) {
      logger.error('Resolve alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve alert'
      });
    }
  }
);

// User management
router.put('/users/:userId/status',
  authenticateToken,
  requireRole(['admin']),
  [
    body('isActive').isBoolean().withMessage('isActive must be boolean')
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

      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info(`User status updated by admin`, { 
        userId, 
        isActive, 
        adminId: req.user.id 
      });

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: { user }
      });

    } catch (error) {
      logger.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }
);

module.exports = router;
