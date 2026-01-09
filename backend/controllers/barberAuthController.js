const Barber = require('../models/Barber');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Register a new barber
 * @route   POST /api/auth/barber/signup
 * @access  Public
 */
const registerBarber = async (req, res) => {
  try {
    const { 
      shopName, 
      ownerName, 
      email, 
      password, 
      phone,
      location,
      address
    } = req.body;

    // Validation
    if (!shopName || !ownerName || !email || !password || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: shopName, ownerName, email, password, phone'
      });
    }

    // Check if barber already exists
    const barberExists = await Barber.findOne({ email });
    if (barberExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Barber with this email already exists'
      });
    }

    // Create barber with default location if not provided (real registration)
    const barberData = {
      shopName,
      ownerName,
      email,
      password,
      phone,
      location: location || {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates - should be updated later
      },
      address: address || {
        city: 'Unknown'
      },
      isTestData: false // Mark as real data (visible to customers)
    };

    const barber = await Barber.create(barberData);

    if (barber) {
      const token = generateToken(barber._id, barber.role);
      
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
          _id: barber._id,
          shopName: barber.shopName,
          shopId: barber.shopId,
          ownerName: barber.ownerName,
          email: barber.email,
          phone: barber.phone,
          role: barber.role,
          token: token
        }
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid barber data'
      });
    }
  } catch (error) {
    console.error('Register barber error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error registering barber'
    });
  }
};

/**
 * @desc    Login barber
 * @route   POST /api/auth/barber/login
 * @access  Public
 */
const loginBarber = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for barber (include password for comparison)
    const barber = await Barber.findOne({ email }).select('+password');

    if (barber && (await barber.matchPassword(password))) {
      const token = generateToken(barber._id, barber.role);
      
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
          _id: barber._id,
          shopName: barber.shopName,
          shopId: barber.shopId,
          ownerName: barber.ownerName,
          email: barber.email,
          phone: barber.phone,
          role: barber.role,
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
    console.error('Login barber error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging in'
    });
  }
};

/**
 * @desc    Get barber profile
 * @route   GET /api/auth/barber/profile
 * @access  Private
 */
const getBarberProfile = async (req, res) => {
  try {
    const barber = await Barber.findById(req.user._id);

    if (barber) {
      res.json({
        status: 'success',
        data: {
          _id: barber._id,
          shopName: barber.shopName,
          shopId: barber.shopId,
          ownerName: barber.ownerName,
          email: barber.email,
          phone: barber.phone,
          role: barber.role,
          location: barber.location,
          address: barber.address,
          rating: barber.rating,
          currentQueueLength: barber.currentQueueLength
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Barber not found'
      });
    }
  } catch (error) {
    console.error('Get barber profile error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching profile'
    });
  }
};

/**
 * @desc    Logout barber
 * @route   POST /api/auth/barber/logout
 * @access  Public
 */
const logoutBarber = async (req, res) => {
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
    console.error('Logout barber error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging out'
    });
  }
};

module.exports = {
  registerBarber,
  loginBarber,
  getBarberProfile,
  logoutBarber
};
