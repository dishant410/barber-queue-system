const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');

/**
 * Barber Management Routes
 * All routes are prefixed with /api/barbers
 */

// Register a new barber shop
router.post('/register', barberController.registerBarber);

// Get nearby barbers based on location
router.get('/nearby', barberController.getNearbyBarbers);

// Get all active barbers
router.get('/', barberController.getAllBarbers);

// Toggle shop open/closed status (must come before /:shopId)
router.patch('/:shopId/toggle-status', barberController.toggleShopStatus);

// Get specific barber by shop ID
router.get('/:shopId', barberController.getBarberByShopId);

// Update barber information
router.patch('/:shopId', barberController.updateBarber);

module.exports = router;
