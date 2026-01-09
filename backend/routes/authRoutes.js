const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  logoutCustomer,
  updateCustomerLocation
} = require('../controllers/authController');
const {
  registerBarber,
  loginBarber,
  getBarberProfile,
  logoutBarber
} = require('../controllers/barberAuthController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/customer/signup', registerCustomer);
router.post('/customer/login', loginCustomer);
router.post('/customer/logout', logoutCustomer);
router.get('/customer/profile', protect, authorize('customer'), getCustomerProfile);
router.patch('/customer/location', protect, authorize('customer'), updateCustomerLocation);

// Barber routes
router.post('/barber/signup', registerBarber);
router.post('/barber/login', loginBarber);
router.post('/barber/logout', logoutBarber);
router.get('/barber/profile', protect, authorize('barber'), getBarberProfile);

module.exports = router;
