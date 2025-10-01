const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: [true, 'Trip ID is required'],
    unique: true,
    trim: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required']
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required']
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver is required']
  },
  scheduledStartTime: {
    type: Date,
    required: [true, 'Scheduled start time is required']
  },
  actualStartTime: Date,
  scheduledEndTime: {
    type: Date,
    required: [true, 'Scheduled end time is required']
  },
  actualEndTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  currentStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  nextStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  stopProgress: [{
    stop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    scheduledArrival: Date,
    actualArrival: Date,
    scheduledDeparture: Date,
    actualDeparture: Date,
    passengersBoarded: {
      type: Number,
      default: 0
    },
    passengersAlighted: {
      type: Number,
      default: 0
    },
    delay: {
      type: Number, // in minutes
      default: 0
    }
  }],
  passengers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    boardingStop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop'
    },
    alightingStop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop'
    },
    fare: Number,
    boardedAt: Date,
    alightedAt: Date,
    status: {
      type: String,
      enum: ['booked', 'boarded', 'completed', 'cancelled'],
      default: 'booked'
    }
  }],
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalPassengers: {
    type: Number,
    default: 0
  },
  averageDelay: {
    type: Number,
    default: 0
  },
  fuelConsumed: Number,
  distanceCovered: Number,
  alerts: [{
    type: {
      type: String,
      enum: ['delay', 'breakdown', 'accident', 'route_deviation', 'overcrowding']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
tripSchema.index({ tripId: 1 });
tripSchema.index({ bus: 1, scheduledStartTime: -1 });
tripSchema.index({ route: 1, scheduledStartTime: -1 });
tripSchema.index({ driver: 1, scheduledStartTime: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledStartTime: -1 });

// Update updatedAt field before saving
tripSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average delay
tripSchema.methods.calculateAverageDelay = function() {
  if (this.stopProgress.length === 0) return 0;
  
  const delays = this.stopProgress
    .filter(stop => stop.actualArrival && stop.scheduledArrival)
    .map(stop => (stop.actualArrival - stop.scheduledArrival) / (1000 * 60)); // Convert to minutes
  
  if (delays.length === 0) return 0;
  
  return delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
};

module.exports = mongoose.model('Trip', tripSchema);
