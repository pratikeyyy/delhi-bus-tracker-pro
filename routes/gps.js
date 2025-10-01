const express = require('express');
const { body, validationResult } = require('express-validator');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { broadcastLocationUpdate } = require('../services/socketService');
const logger = require('../utils/logger');

const router = express.Router();

// GPS location update from driver app
router.post('/location',
  authenticateToken,
  requireRole(['driver']),
  [
    body('busId').isMongoId().withMessage('Valid bus ID is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be positive'),
    body('speed').optional().isFloat({ min: 0 }).withMessage('Speed must be positive'),
    body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Heading must be between 0-360')
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

      const { busId, latitude, longitude, accuracy, speed, heading } = req.body;
      const driverId = req.user.id;

      // Verify driver is assigned to this bus
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      if (bus.assignedDriver.toString() !== driverId) {
        return res.status(403).json({
          success: false,
          message: 'Driver not assigned to this bus'
        });
      }

      // Update bus location
      const locationUpdate = {
        latitude,
        longitude,
        accuracy: accuracy || 10,
        timestamp: new Date(),
        speed: speed || 0,
        heading: heading || 0
      };

      bus.currentLocation = locationUpdate;
      bus.isOnline = true;
      bus.lastSeen = new Date();
      await bus.save();

      // Update current trip if exists
      const currentTrip = await Trip.findById(bus.currentTrip);
      if (currentTrip && currentTrip.status === 'in_progress') {
        // Check if bus has reached next stop
        await checkStopArrival(currentTrip, bus, latitude, longitude);
      }

      // Broadcast location update to passengers
      broadcastLocationUpdate(busId, {
        busNumber: bus.busNumber,
        location: locationUpdate,
        tripId: bus.currentTrip,
        status: bus.status
      });

      logger.info(`Location updated for bus ${bus.busNumber}`, {
        busId,
        driverId,
        location: locationUpdate
      });

      res.json({
        success: true,
        message: 'Location updated successfully',
        data: {
          busId,
          location: locationUpdate,
          isOnline: bus.isOnline
        }
      });

    } catch (error) {
      logger.error('GPS location update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update location'
      });
    }
  }
);

// Bulk location updates (for multiple buses)
router.post('/locations/bulk',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { locations } = req.body;
      
      if (!Array.isArray(locations)) {
        return res.status(400).json({
          success: false,
          message: 'Locations must be an array'
        });
      }

      const updates = [];
      for (const loc of locations) {
        try {
          const bus = await Bus.findById(loc.busId);
          if (bus) {
            bus.currentLocation = {
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy || 10,
              timestamp: new Date(),
              speed: loc.speed || 0,
              heading: loc.heading || 0
            };
            bus.isOnline = true;
            bus.lastSeen = new Date();
            await bus.save();

            broadcastLocationUpdate(loc.busId, {
              busNumber: bus.busNumber,
              location: bus.currentLocation,
              tripId: bus.currentTrip,
              status: bus.status
            });

            updates.push({ busId: loc.busId, success: true });
          } else {
            updates.push({ busId: loc.busId, success: false, error: 'Bus not found' });
          }
        } catch (error) {
          updates.push({ busId: loc.busId, success: false, error: error.message });
        }
      }

      res.json({
        success: true,
        message: 'Bulk location update completed',
        data: { updates }
      });

    } catch (error) {
      logger.error('Bulk GPS update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update locations'
      });
    }
  }
);

// Get current location of a bus
router.get('/location/:busId',
  async (req, res) => {
    try {
      const { busId } = req.params;
      
      const bus = await Bus.findById(busId)
        .populate('assignedRoute', 'routeNumber name')
        .populate('currentTrip');

      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      res.json({
        success: true,
        data: {
          busId: bus._id,
          busNumber: bus.busNumber,
          location: bus.currentLocation,
          isOnline: bus.isOnline,
          lastSeen: bus.lastSeen,
          route: bus.assignedRoute,
          currentTrip: bus.currentTrip,
          status: bus.status
        }
      });

    } catch (error) {
      logger.error('Get location error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get location'
      });
    }
  }
);

// Get locations of all active buses
router.get('/locations/active',
  async (req, res) => {
    try {
      const buses = await Bus.find({ 
        isOnline: true,
        status: 'active',
        'currentLocation.latitude': { $exists: true }
      })
      .populate('assignedRoute', 'routeNumber name')
      .populate('currentTrip', 'status')
      .select('busNumber currentLocation isOnline lastSeen assignedRoute currentTrip status');

      res.json({
        success: true,
        data: buses
      });

    } catch (error) {
      logger.error('Get active locations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active locations'
      });
    }
  }
);

// Helper function to check if bus has arrived at a stop
async function checkStopArrival(trip, bus, latitude, longitude) {
  const geolib = require('geolib');
  const Stop = require('../models/Stop');

  if (!trip.nextStop) return;

  const nextStop = await Stop.findById(trip.nextStop);
  if (!nextStop) return;

  const distance = geolib.getDistance(
    { latitude, longitude },
    { latitude: nextStop.location.latitude, longitude: nextStop.location.longitude }
  );

  // If within 100 meters of the stop
  if (distance <= 100) {
    const stopProgress = trip.stopProgress.find(
      sp => sp.stop.toString() === trip.nextStop.toString()
    );

    if (stopProgress && !stopProgress.actualArrival) {
      stopProgress.actualArrival = new Date();
      
      // Calculate delay
      if (stopProgress.scheduledArrival) {
        const delay = (stopProgress.actualArrival - stopProgress.scheduledArrival) / (1000 * 60);
        stopProgress.delay = Math.max(0, delay);
      }

      // Update current and next stop
      trip.currentStop = trip.nextStop;
      
      // Find next stop in sequence
      const currentStopIndex = trip.route.stops.findIndex(
        s => s.stop.toString() === trip.currentStop.toString()
      );
      
      if (currentStopIndex < trip.route.stops.length - 1) {
        trip.nextStop = trip.route.stops[currentStopIndex + 1].stop;
      } else {
        trip.nextStop = null; // Reached destination
      }

      await trip.save();

      // Broadcast stop arrival
      broadcastLocationUpdate(bus._id, {
        busNumber: bus.busNumber,
        location: bus.currentLocation,
        tripId: trip._id,
        status: bus.status,
        arrivedAtStop: nextStop.name,
        nextStop: trip.nextStop
      });
    }
  }
}

module.exports = router;
