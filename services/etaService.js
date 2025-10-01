const geolib = require('geolib');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Trip = require('../models/Trip');
const logger = require('../utils/logger');

class ETAService {
  constructor() {
    this.historicalData = new Map(); // Cache for historical travel times
    this.trafficFactors = new Map(); // Cache for traffic conditions
  }

  // Calculate ETA for a bus to reach a specific stop
  async calculateETA(busId, targetStopId, options = {}) {
    try {
      const bus = await Bus.findById(busId).populate('assignedRoute currentTrip');
      const targetStop = await Stop.findById(targetStopId);
      
      if (!bus || !targetStop || !bus.currentLocation) {
        throw new Error('Invalid bus or stop data');
      }

      const currentTrip = await Trip.findById(bus.currentTrip).populate('route');
      if (!currentTrip || currentTrip.status !== 'in_progress') {
        return { eta: null, message: 'Bus not currently in service' };
      }

      // Get route information
      const route = await Route.findById(currentTrip.route._id).populate('stops.stop');
      
      // Find target stop in route
      const targetStopIndex = route.stops.findIndex(
        s => s.stop._id.toString() === targetStopId
      );
      
      if (targetStopIndex === -1) {
        throw new Error('Target stop not found in bus route');
      }

      // Calculate distance and time to target stop
      const result = await this.calculateRouteETA(
        bus.currentLocation,
        route.stops,
        targetStopIndex,
        {
          currentSpeed: bus.currentLocation.speed || route.averageSpeed,
          trafficFactor: options.trafficFactor || 1.0,
          useHistoricalData: options.useHistoricalData !== false
        }
      );

      // Add buffer time for stops
      const stopsRemaining = this.countStopsToTarget(route.stops, bus.currentTrip.currentStop, targetStopId);
      const stopBuffer = stopsRemaining * 1.5; // 1.5 minutes per stop

      const totalETA = result.estimatedTime + stopBuffer;

      logger.info(`ETA calculated for bus ${bus.busNumber} to stop ${targetStop.name}`, {
        busId,
        targetStopId,
        eta: totalETA,
        distance: result.distance,
        stopsRemaining
      });

      return {
        eta: Math.round(totalETA),
        distance: result.distance,
        stopsRemaining,
        confidence: result.confidence,
        factors: {
          baseTime: result.estimatedTime,
          stopBuffer,
          trafficFactor: options.trafficFactor || 1.0
        }
      };

    } catch (error) {
      logger.error('ETA calculation error:', error);
      throw error;
    }
  }

  // Calculate ETA along a route
  async calculateRouteETA(currentLocation, routeStops, targetIndex, options = {}) {
    let totalDistance = 0;
    let totalTime = 0;
    let confidence = 0.8; // Base confidence

    // Find current position in route
    const currentStopIndex = this.findNearestStopIndex(currentLocation, routeStops);
    
    for (let i = currentStopIndex; i <= targetIndex; i++) {
      const stop = routeStops[i].stop;
      let segmentDistance, segmentTime;

      if (i === currentStopIndex) {
        // Distance from current location to first stop
        segmentDistance = geolib.getDistance(
          currentLocation,
          { latitude: stop.location.latitude, longitude: stop.location.longitude }
        ) / 1000; // Convert to km
      } else {
        // Distance between consecutive stops
        const prevStop = routeStops[i - 1].stop;
        segmentDistance = geolib.getDistance(
          { latitude: prevStop.location.latitude, longitude: prevStop.location.longitude },
          { latitude: stop.location.latitude, longitude: stop.location.longitude }
        ) / 1000;
      }

      // Calculate time based on historical data or average speed
      if (options.useHistoricalData) {
        const historicalTime = await this.getHistoricalTravelTime(
          i === currentStopIndex ? 'current' : routeStops[i - 1].stop._id,
          stop._id
        );
        
        if (historicalTime) {
          segmentTime = historicalTime * (options.trafficFactor || 1.0);
          confidence += 0.1;
        } else {
          segmentTime = (segmentDistance / (options.currentSpeed / 60)) * (options.trafficFactor || 1.0);
        }
      } else {
        segmentTime = (segmentDistance / (options.currentSpeed / 60)) * (options.trafficFactor || 1.0);
      }

      totalDistance += segmentDistance;
      totalTime += segmentTime;
    }

    return {
      distance: Math.round(totalDistance * 100) / 100,
      estimatedTime: totalTime,
      confidence: Math.min(confidence, 1.0)
    };
  }

  // Find nearest stop index to current location
  findNearestStopIndex(currentLocation, routeStops) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    routeStops.forEach((routeStop, index) => {
      const distance = geolib.getDistance(
        currentLocation,
        {
          latitude: routeStop.stop.location.latitude,
          longitude: routeStop.stop.location.longitude
        }
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  // Count stops remaining to target
  countStopsToTarget(routeStops, currentStopId, targetStopId) {
    const currentIndex = routeStops.findIndex(s => s.stop._id.toString() === currentStopId?.toString());
    const targetIndex = routeStops.findIndex(s => s.stop._id.toString() === targetStopId);
    
    if (currentIndex === -1 || targetIndex === -1) return 0;
    return Math.max(0, targetIndex - currentIndex);
  }

  // Get historical travel time between stops
  async getHistoricalTravelTime(fromStopId, toStopId) {
    const key = `${fromStopId}_${toStopId}`;
    
    if (this.historicalData.has(key)) {
      return this.historicalData.get(key);
    }

    try {
      // Query historical trip data
      const historicalTrips = await Trip.aggregate([
        {
          $match: {
            status: 'completed',
            'stopProgress.stop': { $in: [fromStopId, toStopId] }
          }
        },
        {
          $unwind: '$stopProgress'
        },
        {
          $match: {
            'stopProgress.stop': { $in: [fromStopId, toStopId] },
            'stopProgress.actualArrival': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$_id',
            stops: { $push: '$stopProgress' }
          }
        }
      ]);

      const travelTimes = [];
      
      historicalTrips.forEach(trip => {
        const fromStop = trip.stops.find(s => s.stop.toString() === fromStopId.toString());
        const toStop = trip.stops.find(s => s.stop.toString() === toStopId.toString());
        
        if (fromStop && toStop && fromStop.actualDeparture && toStop.actualArrival) {
          const travelTime = (toStop.actualArrival - fromStop.actualDeparture) / (1000 * 60); // minutes
          if (travelTime > 0 && travelTime < 120) { // Reasonable travel time
            travelTimes.push(travelTime);
          }
        }
      });

      if (travelTimes.length > 0) {
        const avgTime = travelTimes.reduce((sum, time) => sum + time, 0) / travelTimes.length;
        this.historicalData.set(key, avgTime);
        return avgTime;
      }

    } catch (error) {
      logger.error('Historical data query error:', error);
    }

    return null;
  }

  // Update traffic factor based on current conditions
  async updateTrafficFactor(routeId, factor) {
    this.trafficFactors.set(routeId, {
      factor,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  }

  // Get current traffic factor for route
  getTrafficFactor(routeId) {
    const data = this.trafficFactors.get(routeId);
    if (!data || data.expiresAt < new Date()) {
      return 1.0; // Default factor
    }
    return data.factor;
  }

  // Calculate ETA for multiple buses to a stop
  async calculateMultipleBusETA(stopId, limit = 5) {
    try {
      const stop = await Stop.findById(stopId);
      if (!stop) {
        throw new Error('Stop not found');
      }

      // Find all active buses that serve this stop
      const routes = await Route.find({
        'stops.stop': stopId,
        isActive: true
      });

      const routeIds = routes.map(r => r._id);
      
      const activeBuses = await Bus.find({
        assignedRoute: { $in: routeIds },
        isOnline: true,
        status: 'active',
        currentTrip: { $exists: true }
      }).populate('currentTrip assignedRoute');

      const etaPromises = activeBuses.map(async (bus) => {
        try {
          const eta = await this.calculateETA(bus._id, stopId);
          return {
            busId: bus._id,
            busNumber: bus.busNumber,
            route: bus.assignedRoute.routeNumber,
            ...eta
          };
        } catch (error) {
          logger.error(`ETA calculation failed for bus ${bus.busNumber}:`, error);
          return null;
        }
      });

      const results = await Promise.all(etaPromises);
      const validResults = results
        .filter(result => result && result.eta !== null)
        .sort((a, b) => a.eta - b.eta)
        .slice(0, limit);

      return validResults;

    } catch (error) {
      logger.error('Multiple bus ETA calculation error:', error);
      throw error;
    }
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = new Date();
    
    for (const [key, data] of this.trafficFactors.entries()) {
      if (data.expiresAt < now) {
        this.trafficFactors.delete(key);
      }
    }

    // Clear historical data cache if it gets too large
    if (this.historicalData.size > 1000) {
      this.historicalData.clear();
    }
  }
}

// Create singleton instance
const etaService = new ETAService();

// Clean cache every 30 minutes
setInterval(() => {
  etaService.clearExpiredCache();
}, 30 * 60 * 1000);

module.exports = etaService;
