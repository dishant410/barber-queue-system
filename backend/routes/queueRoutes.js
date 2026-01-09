const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { protect } = require('../middleware/auth');

/**
 * Queue Management Routes
 * All routes are prefixed with /api/queue
 */

// Customer routes (protected - requires authentication)
router.post('/join', protect, queueController.joinQueue);
router.delete('/cancel/:id', protect, queueController.cancelQueue);
router.get('/status/:id', queueController.getCustomerStatus);
router.get('/my-queue', protect, queueController.getMyQueueStatus);

// Barber dashboard routes
router.get('/list', queueController.getQueue);
router.patch('/serve/:id', queueController.serveCustomer);
router.patch('/complete/:id', queueController.completeService);

// Statistics
router.get('/stats', queueController.getQueueStats);

module.exports = router;
