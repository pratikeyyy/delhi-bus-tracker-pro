const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopId: {
    type: String,
    required: [true, 'Stop ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Stop name is required'],
    trim: true
  },
  nameTranslations: {
    hi: String, // Hindi
    ta: String, // Tamil
    te: String, // Telugu
    bn: String, // Bengali
    mr: String, // Marathi
    gu: String  // Gujarati
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude']
    }
  },
  address: {
    type: String,
    trim: true
  },
  landmarks: [{
    type: String,
    trim: true
  }],
  amenities: [{
    type: String,
    enum: ['shelter', 'seating', 'lighting', 'cctv', 'wheelchair_accessible', 'restroom', 'parking']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  zone: {
    type: String,
    trim: true
  },
  stopType: {
    type: String,
    enum: ['regular', 'terminal', 'interchange', 'depot'],
    default: 'regular'
  },
  capacity: {
    type: Number,
    default: 50
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

// Geospatial index for location-based queries
stopSchema.index({ location: '2dsphere' });
stopSchema.index({ stopId: 1 });
stopSchema.index({ name: 'text', 'nameTranslations.hi': 'text' });
stopSchema.index({ isActive: 1 });

// Update updatedAt field before saving
stopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get localized name
stopSchema.methods.getLocalizedName = function(language = 'en') {
  if (language === 'en' || !this.nameTranslations) {
    return this.name;
  }
  return this.nameTranslations[language] || this.name;
};

module.exports = mongoose.model('Stop', stopSchema);
