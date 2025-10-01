const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: [true, 'Origin stop is required']
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: [true, 'Destination stop is required']
  },
  stops: [{
    stop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    sequence: {
      type: Number,
      required: true
    },
    distanceFromOrigin: {
      type: Number,
      default: 0
    },
    estimatedTravelTime: {
      type: Number, // in minutes
      default: 0
    }
  }],
  totalDistance: {
    type: Number, // in kilometers
    required: [true, 'Total distance is required']
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: [true, 'Estimated duration is required']
  },
  operatingHours: {
    start: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    end: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    }
  },
  frequency: {
    type: Number, // in minutes
    required: [true, 'Frequency is required'],
    min: [5, 'Minimum frequency is 5 minutes']
  },
  fareStructure: {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: [0, 'Fare cannot be negative']
    },
    perKmRate: {
      type: Number,
      required: [true, 'Per km rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    maxFare: {
      type: Number,
      min: [0, 'Max fare cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  routeType: {
    type: String,
    enum: ['circular', 'linear', 'express'],
    default: 'linear'
  },
  averageSpeed: {
    type: Number, // km/h
    default: 25
  },
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
routeSchema.index({ routeNumber: 1 });
routeSchema.index({ origin: 1, destination: 1 });
routeSchema.index({ isActive: 1 });

// Update updatedAt field before saving
routeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Sort stops by sequence before saving
routeSchema.pre('save', function(next) {
  if (this.stops && this.stops.length > 0) {
    this.stops.sort((a, b) => a.sequence - b.sequence);
  }
  next();
});

module.exports = mongoose.model('Route', routeSchema);
