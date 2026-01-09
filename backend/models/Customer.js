const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Customer Schema for Queue Management
 * Stores information about customers in the barber queue
 */
const customerSchema = new mongoose.Schema({
  // Customer basic information
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
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
    default: 'customer',
    immutable: true
  },

  // Queue-specific information
  tokenNumber: {
    type: Number,
    // Note: uniqueness is enforced per-shop via compound index below
    sparse: true // Allows null values for users not in queue
  },

  shopId: {
    type: String,
    required: true,
    default: 'main-shop' // Allows scalability for multiple shops
  },

  // Status tracking
  status: {
    type: String,
    enum: ['waiting', 'in-service', 'completed', 'cancelled'],
    default: 'waiting'
  },

  // Service preferences (optional)
  serviceType: {
    type: String,
    enum: ['haircut', 'shave', 'haircut-shave', 'styling', 'other'],
    default: 'haircut'
  },

  // Estimated time (in minutes)
  estimatedWaitTime: {
    type: Number,
    default: 0
  },

  // Position in queue
  queuePosition: {
    type: Number,
    default: 0
  },

  // Timestamps
  joinedAt: {
    type: Date,
    default: Date.now
  },

  serviceStartedAt: {
    type: Date
  },

  serviceCompletedAt: {
    type: Date
  },

  // Customer's current location (GeoJSON format) - OPTIONAL
  // Stores customer coordinates when they log in or open the app
  // Only set when customer provides location permission
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function (coords) {
          if (!coords || coords.length === 0) return true; // Allow empty for new customers
          return coords.length === 2 &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates. Use [longitude, latitude] format.'
      }
    }
  },

  // Last known address (optional)
  lastKnownAddress: {
    city: String,
    state: String,
    country: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for tokenNumber unique per shop
// Partial index: only index documents where tokenNumber exists (not null)
customerSchema.index(
  { shopId: 1, tokenNumber: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { tokenNumber: { $type: 'number' } }
  }
);

// Create 2dsphere index for customer location (SPARSE - allows null/missing locations)
customerSchema.index({ location: '2dsphere' }, { sparse: true });

/**
 * Pre-save middleware to hash password and calculate estimated wait time
 */
customerSchema.pre('save', async function (next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Calculate estimated wait time
  if (this.isNew && this.queuePosition) {
    const avgServiceTime = 20; // minutes per customer
    this.estimatedWaitTime = this.queuePosition * avgServiceTime;
  }
  next();
});

/**
 * Instance method to check if password matches
 */
customerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to mark customer as in service
 */
customerSchema.methods.startService = function () {
  this.status = 'in-service';
  this.serviceStartedAt = new Date();
  return this.save();
};

/**
 * Instance method to mark customer as completed
 */
customerSchema.methods.completeService = function () {
  this.status = 'completed';
  this.serviceCompletedAt = new Date();
  return this.save();
};

/**
 * Static method to get next token number
 */
customerSchema.statics.getNextTokenNumber = async function (shopId) {
  const lastCustomer = await this.findOne({ shopId })
    .sort({ tokenNumber: -1 })
    .select('tokenNumber');

  return lastCustomer ? lastCustomer.tokenNumber + 1 : 1;
};

/**
 * Static method to get current queue for a shop
 */
customerSchema.statics.getCurrentQueue = async function (shopId) {
  return this.find({
    shopId,
    status: { $in: ['waiting', 'in-service'] }
  }).sort({ queuePosition: 1 });
};

/**
 * Instance method to update customer location
 * @param {Number} longitude - Customer's longitude
 * @param {Number} latitude - Customer's latitude
 */
customerSchema.methods.updateLocation = function (longitude, latitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);
