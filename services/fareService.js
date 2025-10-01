const geolib = require('geolib');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const logger = require('../utils/logger');

class FareService {
  constructor() {
    this.fareCache = new Map();
    this.distanceCache = new Map();
  }

  // Calculate fare between two stops on a route
  async calculateFare(routeId, fromStopId, toStopId, options = {}) {
    try {
      const cacheKey = `${routeId}_${fromStopId}_${toStopId}`;
      
      // Check cache first
      if (this.fareCache.has(cacheKey)) {
        const cached = this.fareCache.get(cacheKey);
        if (cached.expiresAt > new Date()) {
          return cached.data;
        }
      }

      const route = await Route.findById(routeId).populate('stops.stop');
      if (!route) {
        throw new Error('Route not found');
      }

      const fromStop = await Stop.findById(fromStopId);
      const toStop = await Stop.findById(toStopId);
      
      if (!fromStop || !toStop) {
        throw new Error('Invalid stops');
      }

      // Find stop positions in route
      const fromIndex = route.stops.findIndex(s => s.stop._id.toString() === fromStopId);
      const toIndex = route.stops.findIndex(s => s.stop._id.toString() === toStopId);
      
      if (fromIndex === -1 || toIndex === -1) {
        throw new Error('Stops not found in route');
      }

      if (fromIndex >= toIndex) {
        throw new Error('Invalid journey direction');
      }

      // Calculate distance between stops
      const distance = await this.calculateRouteDistance(route.stops, fromIndex, toIndex);
      
      // Calculate base fare
      let fare = route.fareStructure.baseFare + (distance * route.fareStructure.perKmRate);
      
      // Apply maximum fare limit if set
      if (route.fareStructure.maxFare && fare > route.fareStructure.maxFare) {
        fare = route.fareStructure.maxFare;
      }

      // Apply discounts/surcharges
      fare = this.applyFareModifiers(fare, options);

      // Round to nearest currency unit
      fare = Math.round(fare * 100) / 100;

      const result = {
        fare,
        distance: Math.round(distance * 100) / 100,
        baseFare: route.fareStructure.baseFare,
        distanceFare: distance * route.fareStructure.perKmRate,
        stops: toIndex - fromIndex,
        currency: 'INR',
        breakdown: {
          baseFare: route.fareStructure.baseFare,
          distanceCharge: distance * route.fareStructure.perKmRate,
          discounts: options.discounts || 0,
          surcharges: options.surcharges || 0,
          total: fare
        }
      };

      // Cache result for 1 hour
      this.fareCache.set(cacheKey, {
        data: result,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      });

      logger.info(`Fare calculated for route ${route.routeNumber}`, {
        fromStop: fromStop.name,
        toStop: toStop.name,
        fare,
        distance
      });

      return result;

    } catch (error) {
      logger.error('Fare calculation error:', error);
      throw error;
    }
  }

  // Calculate distance along route between stops
  async calculateRouteDistance(routeStops, fromIndex, toIndex) {
    const cacheKey = `dist_${fromIndex}_${toIndex}_${routeStops.length}`;
    
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey);
    }

    let totalDistance = 0;

    for (let i = fromIndex; i < toIndex; i++) {
      const currentStop = routeStops[i].stop;
      const nextStop = routeStops[i + 1].stop;

      const segmentDistance = geolib.getDistance(
        {
          latitude: currentStop.location.latitude,
          longitude: currentStop.location.longitude
        },
        {
          latitude: nextStop.location.latitude,
          longitude: nextStop.location.longitude
        }
      ) / 1000; // Convert to kilometers

      totalDistance += segmentDistance;
    }

    // Cache distance calculation
    this.distanceCache.set(cacheKey, totalDistance);
    
    return totalDistance;
  }

  // Apply fare modifiers (discounts, surcharges)
  applyFareModifiers(baseFare, options = {}) {
    let modifiedFare = baseFare;

    // Student discount
    if (options.isStudent) {
      modifiedFare *= 0.5; // 50% discount
    }

    // Senior citizen discount
    if (options.isSeniorCitizen) {
      modifiedFare *= 0.3; // 70% discount
    }

    // Disabled person discount
    if (options.isDisabled) {
      modifiedFare *= 0.25; // 75% discount
    }

    // Peak hour surcharge
    if (options.isPeakHour) {
      modifiedFare *= 1.2; // 20% surcharge
    }

    // AC bus surcharge
    if (options.isACBus) {
      modifiedFare *= 1.5; // 50% surcharge
    }

    // Express service surcharge
    if (options.isExpress) {
      modifiedFare *= 1.3; // 30% surcharge
    }

    // Apply minimum fare
    const minimumFare = options.minimumFare || 5;
    if (modifiedFare < minimumFare) {
      modifiedFare = minimumFare;
    }

    return modifiedFare;
  }

  // Calculate fare for multiple route options
  async calculateMultiRouteFare(fromStopId, toStopId, options = {}) {
    try {
      const fromStop = await Stop.findById(fromStopId);
      const toStop = await Stop.findById(toStopId);
      
      if (!fromStop || !toStop) {
        throw new Error('Invalid stops');
      }

      // Find all routes that connect these stops
      const routes = await Route.find({
        'stops.stop': { $all: [fromStopId, toStopId] },
        isActive: true
      }).populate('stops.stop');

      const fareOptions = [];

      for (const route of routes) {
        try {
          const fareData = await this.calculateFare(route._id, fromStopId, toStopId, options);
          
          fareOptions.push({
            routeId: route._id,
            routeNumber: route.routeNumber,
            routeName: route.name,
            ...fareData
          });
        } catch (error) {
          logger.warn(`Failed to calculate fare for route ${route.routeNumber}:`, error.message);
        }
      }

      // Sort by fare (cheapest first)
      fareOptions.sort((a, b) => a.fare - b.fare);

      return {
        fromStop: {
          id: fromStop._id,
          name: fromStop.name
        },
        toStop: {
          id: toStop._id,
          name: toStop.name
        },
        options: fareOptions
      };

    } catch (error) {
      logger.error('Multi-route fare calculation error:', error);
      throw error;
    }
  }

  // Get fare structure for a route
  async getRouteFareStructure(routeId) {
    try {
      const route = await Route.findById(routeId).select('routeNumber name fareStructure totalDistance');
      
      if (!route) {
        throw new Error('Route not found');
      }

      return {
        routeId: route._id,
        routeNumber: route.routeNumber,
        routeName: route.name,
        fareStructure: route.fareStructure,
        totalDistance: route.totalDistance,
        estimatedMaxFare: route.fareStructure.baseFare + 
                         (route.totalDistance * route.fareStructure.perKmRate)
      };

    } catch (error) {
      logger.error('Get fare structure error:', error);
      throw error;
    }
  }

  // Calculate dynamic pricing based on demand
  calculateDynamicFare(baseFare, demandFactor = 1.0, options = {}) {
    let dynamicFare = baseFare;

    // Apply demand-based pricing
    if (demandFactor > 1.5) {
      dynamicFare *= 1.3; // High demand surcharge
    } else if (demandFactor < 0.5) {
      dynamicFare *= 0.9; // Low demand discount
    }

    // Time-based pricing
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      dynamicFare *= 1.2; // Peak hours
    } else if (hour >= 22 || hour <= 5) {
      dynamicFare *= 0.8; // Off-peak hours
    }

    // Weather-based pricing
    if (options.badWeather) {
      dynamicFare *= 1.1; // Bad weather surcharge
    }

    return Math.round(dynamicFare * 100) / 100;
  }

  // Validate fare payment
  validateFarePayment(calculatedFare, paidAmount, tolerance = 0.01) {
    const difference = Math.abs(calculatedFare - paidAmount);
    
    return {
      isValid: difference <= tolerance,
      calculatedFare,
      paidAmount,
      difference,
      status: difference <= tolerance ? 'valid' : 
              paidAmount < calculatedFare ? 'underpaid' : 'overpaid'
    };
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = new Date();
    
    for (const [key, data] of this.fareCache.entries()) {
      if (data.expiresAt < now) {
        this.fareCache.delete(key);
      }
    }

    // Clear distance cache if it gets too large
    if (this.distanceCache.size > 500) {
      this.distanceCache.clear();
    }
  }

  // Get fare statistics for analytics
  async getFareStatistics(routeId, period = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // This would typically query trip/payment data
      // For now, return mock statistics
      return {
        routeId,
        period,
        averageFare: 15.50,
        totalRevenue: 125000,
        totalTrips: 8064,
        fareRange: {
          minimum: 5.00,
          maximum: 45.00
        },
        popularSegments: [
          { from: 'Station', to: 'Market', count: 1250, avgFare: 12.00 },
          { from: 'Market', to: 'College', count: 980, avgFare: 18.50 }
        ]
      };

    } catch (error) {
      logger.error('Fare statistics error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const fareService = new FareService();

// Clean cache every hour
setInterval(() => {
  fareService.clearExpiredCache();
}, 60 * 60 * 1000);

module.exports = fareService;
