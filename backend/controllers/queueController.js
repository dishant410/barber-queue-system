const Customer = require('../models/Customer');

/**
 * Controller for Queue Management Operations
 * Handles all business logic for customer queue management
 */

/**
 * @desc    Add a new customer to the queue
 * @route   POST /api/queue/join
 * @access  Private (requires authentication)
 */
exports.joinQueue = async (req, res) => {
  try {
    const { serviceType, shopId = 'main-shop' } = req.body;

    // User is authenticated - req.user is set by auth middleware
    const { name, phone, email } = req.user;

    // Validate service type
    if (!serviceType) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type is required'
      });
    }

    // Get next token number
    const tokenNumber = await Customer.getNextTokenNumber(shopId);

    // Get current queue count for position
    const queueCount = await Customer.countDocuments({
      shopId,
      status: { $in: ['waiting', 'in-service'] }
    });

    // Update existing customer or create with auth info
    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        name,
        phone,
        email,
        serviceType,
        shopId,
        tokenNumber,
        queuePosition: queueCount + 1,
        status: 'waiting'
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Emit real-time update to barber dashboard
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('queue-update', {
        type: 'customer-joined',
        customer: {
          _id: customer._id,
          name: customer.name,
          tokenNumber: customer.tokenNumber,
          queuePosition: customer.queuePosition,
          serviceType: customer.serviceType,
          status: customer.status
        },
        shopId
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Successfully joined the queue',
      data: {
        tokenNumber: customer.tokenNumber,
        queuePosition: customer.queuePosition,
        estimatedWaitTime: customer.estimatedWaitTime,
        customerId: customer._id
      }
    });
  } catch (error) {
    console.error('Error in joinQueue:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to join queue'
    });
  }
};

/**
 * @desc    Cancel queue entry for authenticated user
 * @route   DELETE /api/queue/cancel/:id
 * @access  Private (requires authentication)
 */
exports.cancelQueue = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const userEmail = req.user.email;

    // Validate MongoDB ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid queue entry ID'
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Queue entry not found'
      });
    }

    // Verify the customer belongs to this user
    if (customer.email !== userEmail) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only cancel your own queue entry'
      });
    }

    // Only allow cancellation if still waiting
    if (customer.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot cancel - service already ${customer.status}`
      });
    }

    const shopId = customer.shopId;

    // Update status to cancelled instead of deleting (preserves user account)
    customer.status = 'cancelled';
    customer.tokenNumber = null;
    customer.queuePosition = 0;
    customer.shopId = 'main-shop'; // Reset to default
    await customer.save();

    // Update queue positions for remaining customers
    await updateQueuePositions(shopId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${shopId}`).emit('queue-update', {
        type: 'customer-cancelled',
        customerId: id,
        shopId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Queue entry cancelled successfully'
    });
  } catch (error) {
    console.error('Error in cancelQueue:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      id: req.params.id,
      user: req.user ? req.user.email : 'not authenticated'
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to cancel queue entry'
    });
  }
};

/**
 * @desc    Get current user's active queue status
 * @route   GET /api/queue/my-queue
 * @access  Private (requires authentication)
 */
exports.getMyQueueStatus = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Find active queue entry for this user
    const customer = await Customer.findOne({
      email: userEmail,
      status: { $in: ['waiting', 'in-service'] }
    });

    if (!customer) {
      return res.status(200).json({
        status: 'success',
        data: null,
        message: 'No active queue entry'
      });
    }

    // Recalculate position if waiting
    if (customer.status === 'waiting') {
      const position = await Customer.countDocuments({
        shopId: customer.shopId,
        status: 'waiting',
        queuePosition: { $lt: customer.queuePosition }
      });
      customer.queuePosition = position + 1;
    }

    res.status(200).json({
      status: 'success',
      data: customer
    });
  } catch (error) {
    console.error('Error in getMyQueueStatus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queue status'
    });
  }
};

/**
 * @desc    Get all customers in current queue
 * @route   GET /api/queue/list
 * @access  Public (Barber Dashboard)
 */
exports.getQueue = async (req, res) => {
  try {
    const { shopId = 'main-shop' } = req.query;

    const queue = await Customer.getCurrentQueue(shopId);

    res.status(200).json({
      status: 'success',
      count: queue.length,
      data: queue
    });
  } catch (error) {
    console.error('Error in getQueue:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queue'
    });
  }
};

/**
 * @desc    Get customer status by token or ID
 * @route   GET /api/queue/status/:id
 * @access  Public
 */
exports.getCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId = 'main-shop' } = req.query;

    let customer = null;

    // Try to find by ID first (if it's a valid MongoDB ObjectId)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    // If not found, try by token number
    if (!customer) {
      customer = await Customer.findOne({
        tokenNumber: parseInt(id),
        shopId
      });
    }

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    // Recalculate queue position if still waiting
    if (customer.status === 'waiting') {
      const position = await Customer.countDocuments({
        shopId,
        status: 'waiting',
        queuePosition: { $lte: customer.queuePosition }
      });
      customer.queuePosition = position;
    }

    res.status(200).json({
      status: 'success',
      data: customer
    });
  } catch (error) {
    console.error('Error in getCustomerStatus:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer status'
    });
  }
};

/**
 * @desc    Start service for next customer (FIFO)
 * @route   PATCH /api/queue/serve/:id
 * @access  Private (Barber only)
 */
exports.serveCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    if (customer.status !== 'waiting') {
      return res.status(400).json({
        status: 'error',
        message: 'Customer is not in waiting status'
      });
    }

    await customer.startService();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${customer.shopId}`).emit('queue-update', {
        type: 'customer-serving',
        customerId: customer._id,
        shopId: customer.shopId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Customer service started',
      data: customer
    });
  } catch (error) {
    console.error('Error in serveCustomer:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start service'
    });
  }
};

/**
 * @desc    Complete service for a customer
 * @route   PATCH /api/queue/complete/:id
 * @access  Private (Barber only)
 */
exports.completeService = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }

    await customer.completeService();

    // Update queue positions for remaining customers
    await updateQueuePositions(customer.shopId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`shop-${customer.shopId}`).emit('queue-update', {
        type: 'customer-completed',
        customerId: customer._id,
        shopId: customer.shopId
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Service completed successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error in completeService:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete service'
    });
  }
};

/**
 * @desc    Get queue statistics
 * @route   GET /api/queue/stats
 * @access  Public
 */
exports.getQueueStats = async (req, res) => {
  try {
    const { shopId = 'main-shop' } = req.query;

    const waiting = await Customer.countDocuments({ shopId, status: 'waiting' });
    const inService = await Customer.countDocuments({ shopId, status: 'in-service' });
    const completedToday = await Customer.countDocuments({
      shopId,
      status: 'completed',
      serviceCompletedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const avgServiceTime = 20; // minutes
    const estimatedWaitTime = waiting * avgServiceTime;

    res.status(200).json({
      status: 'success',
      data: {
        waiting,
        inService,
        completedToday,
        totalInQueue: waiting + inService,
        estimatedWaitTime
      }
    });
  } catch (error) {
    console.error('Error in getQueueStats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics'
    });
  }
};

/**
 * Helper function to update queue positions after completion
 */
async function updateQueuePositions(shopId) {
  const waitingCustomers = await Customer.find({
    shopId,
    status: 'waiting'
  }).sort({ queuePosition: 1 });

  for (let i = 0; i < waitingCustomers.length; i++) {
    waitingCustomers[i].queuePosition = i + 1;
    waitingCustomers[i].estimatedWaitTime = (i + 1) * 20; // 20 min avg
    await waitingCustomers[i].save();
  }
}
