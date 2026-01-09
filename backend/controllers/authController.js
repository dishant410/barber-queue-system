const Customer = require('../models/Customer');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Register a new customer
 * @route   POST /api/auth/customer/signup
 * @access  Public
 */
const registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: name, email, password, phone'
      });
    }

    // Check if customer already exists
    const customerExists = await Customer.findOne({ email });
    if (customerExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer with this email already exists'
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      password,
      phone
    });

    if (customer) {
      const token = generateToken(customer._id, customer.role);
      
      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.status(201).json({
        status: 'success',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          token: token
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid customer data'
      });
    }
  } catch (error) {
    console.error('Register customer error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error registering customer'
    });
  }
};

/**
 * @desc    Login customer
 * @route   POST /api/auth/customer/login
 * @access  Public
 */
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for customer (include password for comparison)
    const customer = await Customer.findOne({ email }).select('+password');

    if (customer && (await customer.matchPassword(password))) {
      const token = generateToken(customer._id, customer.role);
      
      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({
        status: 'success',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role,
          token: token
        }
      });
    } else {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login customer error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging in'
    });
  }
};

/**
 * @desc    Get customer profile
 * @route   GET /api/auth/customer/profile
 * @access  Private
 */
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);

    if (customer) {
      res.json({
        status: 'success',
        data: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          role: customer.role
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching profile'
    });
  }
};

/**
 * @desc    Logout customer
 * @route   POST /api/auth/customer/logout
 * @access  Public
 */
const logoutCustomer = async (req, res) => {
  try {
    // Clear auth cookie
    res.cookie('authToken', '', {
      httpOnly: true,
      expires: new Date(0)
    });
    
    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout customer error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging out'
    });
  }
};

/**
 * @desc    Update customer location (captures customer coordinates on login/app open)
 * @route   PATCH /api/auth/customer/location
 * @access  Private (requires authentication)
 */
const updateCustomerLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates provided'
      });
    }

    // Find customer and update location
    const customer = await Customer.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Update location using GeoJSON format [longitude, latitude]
    customer.location = {
      type: 'Point',
      coordinates: [lon, lat]
    };

    // Update address if provided
    if (address) {
      customer.lastKnownAddress = {
        city: address.city || '',
        state: address.state || '',
        country: address.country || ''
      };
    }

    await customer.save();

    console.log(`📍 Updated location for customer ${customer.name}: [${lon}, ${lat}]`);

    res.json({
      status: 'success',
      message: 'Location updated successfully',
      data: {
        location: {
          latitude: lat,
          longitude: lon
        },
        address: customer.lastKnownAddress
      }
    });
  } catch (error) {
    console.error('Update customer location error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating location'
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  logoutCustomer,
  updateCustomerLocation
};
