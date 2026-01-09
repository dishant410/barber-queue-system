const mongoose = require('mongoose');

/**
 * BarberShop Schema with GeoJSON location support
 * Enables geospatial queries to find nearby barber shops
 */
const barberShopSchema = new mongoose.Schema({
  // Basic shop information
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    minlength: [2, 'Shop name must be at least 2 characters'],
    maxlength: [100, 'Shop name cannot exceed 100 characters'],
    alias: 'shopName' // Alias to match Barber model
  },

  // Owner information
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },

  ownerPhone: {
    type: String,
    required: [true, 'Owner phone is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    alias: 'phone' // Alias to match Barber model
  },

  ownerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    alias: 'email'
  },

  // Shop Details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  images: [{
    type: String // URL to image
  }],

  gender: {
    type: String,
    enum: ['unisex', 'men', 'women'],
    default: 'men'
  },

  // Physical address
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
      alias: 'zipCode'
    }
  },

  // GeoJSON location for geospatial queries
  // Format: { type: "Point", coordinates: [longitude, latitude] }
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (coords) {
          // Validate longitude (-180 to 180) and latitude (-90 to 90)
          return coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates. Use [longitude, latitude] format.'
      }
    }
  },

  // Shop status
  isActive: {
    type: Boolean,
    default: true
  },

  // Shop open/closed status (independent of active status)
  isOpen: {
    type: Boolean,
    default: true
  },

  // Flag to identify test/dummy data (exclude from customer queries)
  isTestData: {
    type: Boolean,
    default: false,
    index: true // Index for faster filtering
  },

  // Operating hours
  operatingHours: {
    opening: {
      type: String,
      default: '09:00',
      alias: 'openingTime'
    },
    closing: {
      type: String,
      default: '20:00',
      alias: 'closingTime'
    }
  },

  // Services offered
  services: [{
    type: String,
    enum: ['haircut', 'shave', 'haircut-shave', 'styling', 'beard-trim', 'facial', 'head-massage', 'hair-color', 'other']
  }],

  // Facilities & Features
  facilities: {
    hasParking: { type: Boolean, default: false, alias: 'hasParking' },
    hasAC: { type: Boolean, default: false, alias: 'hasAC' },
    hasWifi: { type: Boolean, default: false },
    hasTV: { type: Boolean, default: false },
    hasRestroom: { type: Boolean, default: false }
  },

  paymentMethods: [{
    type: String,
    enum: ['cash', 'upi', 'card', 'wallet']
  }],

  // Ratings and reviews
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    alias: 'rating' // Alias to match Barber model
  },

  totalReviews: {
    type: Number,
    default: 0,
    alias: 'totalRatings' // Alias to match Barber model
  },

  // Shop ID for queue management
  shopId: {
    type: String,
    unique: true,
    required: true
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Create 2dsphere index for geospatial queries
 * This enables efficient location-based searches
 */
barberShopSchema.index({ location: '2dsphere' });

/**
 * Create index on shopId for faster lookups
 */
barberShopSchema.index({ shopId: 1 });

/**
 * Static method to find nearby barber shops
 * Uses MongoDB's $nearSphere operator for geospatial queries
 * 
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @param {Number} maxDistance - Maximum distance in meters (default: 5000m = 5km)
 * @returns {Promise<Array>} - Array of nearby barber shops
 */
barberShopSchema.statics.findNearby = async function (longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true // Only return active shops
  }).select('-__v');
};

/**
 * Static method to find nearby barber shops with distance calculation
 * Uses MongoDB's $geoNear aggregation for more detailed results
 * 
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @param {Number} maxDistance - Maximum distance in meters
 * @returns {Promise<Array>} - Array of nearby shops with distance info
 */
barberShopSchema.statics.findNearbyWithDistance = async function (longitude, latitude, maxDistance = 5000) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        distanceField: 'distance',
        distanceMultiplier: 0.001, // Convert meters to kilometers
        maxDistance: maxDistance,
        spherical: true,
        query: { isActive: true }
      }
    },
    {
      $project: {
        __v: 0
      }
    }
  ]);
};

/**
 * Instance method to update location
 */
barberShopSchema.methods.updateLocation = function (longitude, latitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  return this.save();
};

/**
 * Instance method to toggle active status
 */
barberShopSchema.methods.toggleActive = function () {
  this.isActive = !this.isActive;
  return this.save();
};

/**
 * Instance method to calculate distance from given coordinates
 * Uses Haversine formula for accurate distance calculation
 * @param {Number} longitude - Target longitude
 * @param {Number} latitude - Target latitude
 * @returns {Number} - Distance in kilometers
 */
barberShopSchema.methods.getDistance = function (longitude, latitude) {
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

module.exports = mongoose.model('BarberShop', barberShopSchema);
