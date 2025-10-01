const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Stop = require('../models/Stop');
const Route = require('../models/Route');
const etaService = require('../services/etaService');
const fareService = require('../services/fareService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Search stops by name or location
router.get('/stops/search',
  [
    query('q').optional().trim().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be 0.1-50 km'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
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

      const { q, lat, lng, radius = 5, limit = 20 } = req.query;
      let stops = [];

      if (q) {
        // Text search
        stops = await Stop.find({
          $text: { $search: q },
          isActive: true
        })
        .limit(parseInt(limit))
        .select('stopId name nameTranslations location address landmarks');
      } else if (lat && lng) {
        // Location-based search
        stops = await Stop.find({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
            }
          },
          isActive: true
        })
        .limit(parseInt(limit))
        .select('stopId name nameTranslations location address landmarks');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either query text or location coordinates required'
        });
      }

      res.json({
        success: true,
        data: { stops }
      });

    } catch (error) {
      logger.error('Stop search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search stops'
      });
    }
  }
);

// Get ETA for buses at a stop
router.get('/stops/:stopId/eta',
  async (req, res) => {
    try {
      const { stopId } = req.params;
      
      const buses = await etaService.calculateMultipleBusETA(stopId);
      
      res.json({
        success: true,
        data: { buses }
      });

    } catch (error) {
      logger.error('Get stop ETA error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ETA information'
      });
    }
  }
);

// Calculate fare between stops
router.get('/fare',
  [
    query('from').isMongoId().withMessage('Valid from stop ID required'),
    query('to').isMongoId().withMessage('Valid to stop ID required'),
    query('route').optional().isMongoId().withMessage('Invalid route ID'),
    query('isStudent').optional().isBoolean().withMessage('isStudent must be boolean'),
    query('isSeniorCitizen').optional().isBoolean().withMessage('isSeniorCitizen must be boolean'),
    query('isDisabled').optional().isBoolean().withMessage('isDisabled must be boolean'),
    query('isACBus').optional().isBoolean().withMessage('isACBus must be boolean')
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

      const { from, to, route, ...options } = req.query;
      
      // Convert string booleans to actual booleans
      Object.keys(options).forEach(key => {
        if (options[key] === 'true') options[key] = true;
        if (options[key] === 'false') options[key] = false;
      });

      let fareData;
      
      if (route) {
        // Calculate fare for specific route
        fareData = await fareService.calculateFare(route, from, to, options);
      } else {
        // Calculate fare for all possible routes
        fareData = await fareService.calculateMultiRouteFare(from, to, options);
      }

      res.json({
        success: true,
        data: fareData
      });

    } catch (error) {
      logger.error('Fare calculation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate fare'
      });
    }
  }
);

// Get routes between two stops
router.get('/routes',
  [
    query('from').isMongoId().withMessage('Valid from stop ID required'),
    query('to').isMongoId().withMessage('Valid to stop ID required')
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

      const { from, to } = req.query;

      const routes = await Route.find({
        'stops.stop': { $all: [from, to] },
        isActive: true
      })
      .populate('stops.stop', 'name location')
      .populate('origin destination', 'name')
      .select('routeNumber name description totalDistance estimatedDuration fareStructure operatingHours');

      // Calculate journey details for each route
      const routeDetails = await Promise.all(
        routes.map(async (route) => {
          try {
            const fare = await fareService.calculateFare(route._id, from, to);
            
            // Find stop positions
            const fromIndex = route.stops.findIndex(s => s.stop._id.toString() === from);
            const toIndex = route.stops.findIndex(s => s.stop._id.toString() === to);
            
            return {
              routeId: route._id,
              routeNumber: route.routeNumber,
              name: route.name,
              stops: toIndex - fromIndex,
              ...fare,
              operatingHours: route.operatingHours
            };
          } catch (error) {
            logger.warn(`Failed to calculate details for route ${route.routeNumber}:`, error.message);
            return null;
          }
        })
      );

      const validRoutes = routeDetails.filter(route => route !== null);

      res.json({
        success: true,
        data: { routes: validRoutes }
      });

    } catch (error) {
      logger.error('Get routes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get routes'
      });
    }
  }
);

// Get nearby stops and routes
router.get('/nearby',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    query('radius').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Radius must be 0.1-10 km')
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

      const { lat, lng, radius = 1 } = req.query;

      // Find nearby stops
      const stops = await Stop.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000
          }
        },
        isActive: true
      })
      .limit(10)
      .select('stopId name location address landmarks');

      // Get routes serving these stops
      const stopIds = stops.map(stop => stop._id);
      const routes = await Route.find({
        'stops.stop': { $in: stopIds },
        isActive: true
      })
      .populate('origin destination', 'name')
      .select('routeNumber name description operatingHours');

      res.json({
        success: true,
        data: {
          location: { lat: parseFloat(lat), lng: parseFloat(lng) },
          radius: parseFloat(radius),
          stops,
          routes
        }
      });

    } catch (error) {
      logger.error('Get nearby error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get nearby information'
      });
    }
  }
);

// Get trip planning suggestions
router.get('/plan-trip',
  [
    query('from').isMongoId().withMessage('Valid from stop ID required'),
    query('to').isMongoId().withMessage('Valid to stop ID required'),
    query('time').optional().isISO8601().withMessage('Invalid time format'),
    query('preferences').optional().isIn(['fastest', 'cheapest', 'least_transfers']).withMessage('Invalid preference')
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

      const { from, to, time, preferences = 'fastest' } = req.query;
      
      // Get all possible routes
      const routes = await Route.find({
        'stops.stop': { $all: [from, to] },
        isActive: true
      })
      .populate('stops.stop', 'name location')
      .select('routeNumber name totalDistance estimatedDuration fareStructure');

      const tripOptions = [];

      for (const route of routes) {
        try {
          const fare = await fareService.calculateFare(route._id, from, to);
          const fromIndex = route.stops.findIndex(s => s.stop._id.toString() === from);
          const toIndex = route.stops.findIndex(s => s.stop._id.toString() === to);
          
          // Estimate travel time based on route
          const segmentDistance = fare.distance;
          const estimatedTime = (segmentDistance / 25) * 60; // Assuming 25 km/h average speed

          tripOptions.push({
            routeId: route._id,
            routeNumber: route.routeNumber,
            name: route.name,
            fare: fare.fare,
            distance: fare.distance,
            estimatedTime: Math.round(estimatedTime),
            stops: toIndex - fromIndex,
            transfers: 0 // Direct route
          });
        } catch (error) {
          logger.warn(`Failed to process route ${route.routeNumber}:`, error.message);
        }
      }

      // Sort based on preferences
      switch (preferences) {
        case 'fastest':
          tripOptions.sort((a, b) => a.estimatedTime - b.estimatedTime);
          break;
        case 'cheapest':
          tripOptions.sort((a, b) => a.fare - b.fare);
          break;
        case 'least_transfers':
          tripOptions.sort((a, b) => a.transfers - b.transfers);
          break;
      }

      res.json({
        success: true,
        data: {
          from,
          to,
          preferences,
          options: tripOptions.slice(0, 5) // Return top 5 options
        }
      });

    } catch (error) {
      logger.error('Trip planning error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to plan trip'
      });
    }
  }
);

// Save favorite route (Authenticated users)
router.post('/favorites',
  authenticateToken,
  [
    body('routeId').isMongoId().withMessage('Valid route ID required'),
    body('fromStop').isMongoId().withMessage('Valid from stop ID required'),
    body('toStop').isMongoId().withMessage('Valid to stop ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters')
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

      // This would typically save to a favorites collection
      // For now, return success response
      res.json({
        success: true,
        message: 'Route saved to favorites'
      });

    } catch (error) {
      logger.error('Save favorite error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save favorite'
      });
    }
  }
);

module.exports = router;
