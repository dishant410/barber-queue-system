const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Barber/Shop Schema for Location-based Discovery
 * Stores barber shop information including location data
 */
const barberSchema = new mongoose.Schema({
  // Basic shop information
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    minlength: [2, 'Shop name must be at least 2 characters long'],
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },

  shopId: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return this.shopName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    }
  },

  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  role: {
    type: String,
    default: 'barber',
    immutable: true
  },

  // Location data (GeoJSON format for MongoDB geospatial queries)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (coords) {
          return coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 && // longitude
            coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },

  // Address information
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },

  // Business details
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.5
  },

  // Flag to identify test/dummy data (exclude from customer queries)
  isTestData: {
    type: Boolean,
    default: false,
    index: true // Index for faster filtering
  },

  totalRatings: {
    type: Number,
    default: 0
  },

  // Queue information
  currentQueueLength: {
    type: Number,
    default: 0,
    min: 0
  },

  averageWaitTime: {
    type: Number, // in minutes
    default: 15,
    min: 0
  },

  // Services offered
  services: [{
    type: String,
    enum: ['haircut', 'shave', 'haircut-shave', 'styling', 'beard-trim', 'facial', 'other']
  }],

  // Operating hours
  isOpen: {
    type: Boolean,
    default: true
  },

  openingTime: {
    type: String,
    default: '09:00'
  },

  closingTime: {
    type: String,
    default: '20:00'
  },

  // Additional features
  hasParking: {
    type: Boolean,
    default: false
  },

  hasAC: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily-closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
barberSchema.index({ location: '2dsphere' });
barberSchema.index({ shopId: 1 });
barberSchema.index({ status: 1, isOpen: 1 });

/**
 * Pre-save middleware to hash password
 */
barberSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

/**
 * Instance method to check if password matches
 */
barberSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Static method to find nearby barbers
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @param {Number} maxDistance - Maximum distance in meters (default 5000m = 5km)
 * @returns {Promise<Array>} - Array of nearby barbers
 */
barberSchema.statics.findNearby = function (longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active'
  }).select('-__v');
};

/**
 * Instance method to calculate distance from a point
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @returns {Number} - Distance in kilometers
 */
barberSchema.methods.getDistance = function (longitude, latitude) {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = this.location.coordinates[1];
  const lon1 = this.location.coordinates[0];
  const lat2 = latitude;
  const lon2 = longitude;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Virtual property for formatted address
 */
barberSchema.virtual('fullAddress').get(function () {
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode
  ].filter(Boolean);
  return parts.join(', ');
});

// Ensure virtuals are included in JSON
barberSchema.set('toJSON', { virtuals: true });
barberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Barber', barberSchema);
