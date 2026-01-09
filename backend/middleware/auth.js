const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '30d' }
  );
};

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, no token'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    // Get user from token based on role
    if (decoded.role === 'customer') {
      req.user = await Customer.findById(decoded.id).select('-password');
    } else if (decoded.role === 'barber') {
      req.user = await Barber.findById(decoded.id).select('-password');
    }

    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, user not found'
      });
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized, invalid token'
    });
  }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.userRole} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, generateToken };
