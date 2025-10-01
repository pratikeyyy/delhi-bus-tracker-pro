const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  capacity: {
    type: Number,
    required: [true, 'Bus capacity is required'],
    min: [10, 'Minimum capacity is 10'],
    max: [100, 'Maximum capacity is 100']
  },
  type: {
    type: String,
    enum: ['city', 'intercity', 'express', 'deluxe', 'ac', 'non-ac'],
    default: 'city'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'retired'],
    default: 'active'
  },
  currentLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude']
    },
    longitude: {
      type: Number,
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude']
    },
    accuracy: Number,
    timestamp: Date,
    speed: Number,
    heading: Number
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  features: [{
    type: String,
    enum: ['wifi', 'ac', 'gps', 'cctv', 'wheelchair_accessible', 'low_floor']
  }],
  lastMaintenance: Date,
  nextMaintenanceDue: Date,
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'cng', 'electric', 'hybrid'],
    default: 'diesel'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
busSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ assignedRoute: 1 });
busSchema.index({ status: 1 });

// Update updatedAt field before saving
busSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for current occupancy (to be populated from trips)
busSchema.virtual('currentOccupancy').get(function() {
  return this._currentOccupancy || 0;
});

module.exports = mongoose.model('Bus', busSchema);
