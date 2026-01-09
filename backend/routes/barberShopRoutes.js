const express = require('express');
const router = express.Router();
const barberShopController = require('../controllers/barberShopController');

/**
 * Barber Shop Location-based Routes
 * All routes are prefixed with /api/barbers
 */

// Get nearby barber shops (location-based search)
router.get('/nearby', barberShopController.getNearbyBarbers);

// Register a new barber shop
router.post('/register', barberShopController.registerBarberShop);

// Get all barber shops
router.get('/list', barberShopController.getAllBarbers);

// Toggle shop open/closed status (must come before /:id)
router.patch('/:shopId/toggle-status', require('../controllers/barberController').toggleShopStatus);

// Get barber shop by unique Shop ID (must come before /:id)
router.get('/shop/:shopId', require('../controllers/barberController').getBarberByShopId);

// Get barber shop by ID (MongoDB _id)
router.get('/:id', barberShopController.getBarberById);

// Update barber shop location
router.patch('/:id/location', barberShopController.updateBarberLocation);

// Toggle barber shop active status
router.patch('/:id/toggle-active', barberShopController.toggleBarberActive);

module.exports = router;
