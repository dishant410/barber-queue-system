const Barber = require('../models/Barber');
const BarberShop = require('../models/BarberShop');
const Customer = require('../models/Customer');

/**
 * Controller for Barber Location and Discovery
 * Handles barber registration and nearby search
 */

/**
 * @desc    Register a new barber shop
 * @route   POST /api/barbers/register
 * @access  Public (should be protected in production)
 */
exports.registerBarber = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      phone,
      email,
      latitude,
      longitude,
      address,
      services,
      openingTime,
      closingTime
    } = req.body;

    // Validate required fields
    if (!shopName || !ownerName || !phone || !latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Shop name, owner name, phone, and location coordinates are required'
      });
    }

    // Create barber shop
    const barber = await Barber.create({
      shopName,
      ownerName,
      phone,
      email,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address: address || {},
      services: services || ['haircut', 'shave'],
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '20:00'
    });

    res.status(201).json({
      status: 'success',
      message: 'Barber shop registered successfully',
      data: barber
    });
  } catch (error) {
    console.error('Error in registerBarber:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to register barber shop'
    });
  }
};

/**
 * @desc    Find nearby barbers within specified radius (default 2km)
 * @route   GET /api/barbers/nearby
 * @access  Public
 * @queryParams latitude, longitude, radius (optional, default 2000m)
 */
exports.getNearbyBarbers = async (req, res) => {
  try {
    const { latitude, longitude, lat, lng, radius = 2000 } = req.query;

    // Support both latitude/longitude and lat/lng parameters
    const userLat = parseFloat(latitude || lat);
    const userLon = parseFloat(longitude || lng);

    // Validate coordinates
    if (!userLat || !userLon || isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid latitude and longitude are required'
      });
    }

    const maxDistance = parseInt(radius);

    // Validate coordinate ranges
    if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Validate radius
    if (maxDistance < 0 || maxDistance > 50000) {
      return res.status(400).json({
        status: 'error',
        message: 'Radius must be between 0 and 50000 meters'
      });
    }

    // Find nearby barbers using MongoDB geospatial query
    // Uses 2dsphere index with $near for efficient spherical distance calculation
    const barbers = await Barber.findNearby(userLon, userLat, maxDistance);

    // Enrich barber data with distance and current queue info
    const enrichedBarbers = await Promise.all(
      barbers.map(async (barber) => {
        // Calculate distance using Haversine formula
        const distance = barber.getDistance(userLon, userLat);

        // Get current queue length (waiting + in-service customers)
        const queueLength = await Customer.countDocuments({
          shopId: barber.shopId,
          status: { $in: ['waiting', 'in-service'] }
        });

        // Calculate estimated wait time based on queue and average service time
        const estimatedWaitTime = queueLength * barber.averageWaitTime;

        // Format wait time for display
        let waitTimeText;
        if (estimatedWaitTime === 0) {
          waitTimeText = 'No wait';
        } else if (estimatedWaitTime < 60) {
          waitTimeText = `${estimatedWaitTime} min`;
        } else {
          const hours = Math.floor(estimatedWaitTime / 60);
          const mins = estimatedWaitTime % 60;
          waitTimeText = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
        }

        return {
          id: barber._id,
          shopId: barber.shopId,
          shopName: barber.shopName,
          ownerName: barber.ownerName,
          phone: barber.phone,
          rating: barber.rating,
          totalRatings: barber.totalRatings,
          distance: distance,
          distanceText: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`,
          queueLength: queueLength,
          estimatedWaitTime: estimatedWaitTime,
          waitTimeText: waitTimeText,
          isOpen: barber.isOpen,
          status: barber.status,
          services: barber.services,
          address: barber.fullAddress,
          openingTime: barber.openingTime,
          closingTime: barber.closingTime,
          hasParking: barber.hasParking,
          hasAC: barber.hasAC,
          coordinates: {
            latitude: barber.location.coordinates[1],
            longitude: barber.location.coordinates[0]
          },
          // Add timestamp for caching purposes
          lastUpdated: new Date().toISOString()
        };
      })
    );

    // Sort by distance (nearest first)
    enrichedBarbers.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      status: 'success',
      count: enrichedBarbers.length,
      radius: `${maxDistance / 1000} km`,
      userLocation: {
        latitude: userLat,
        longitude: userLon
      },
      data: enrichedBarbers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getNearbyBarbers:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch nearby barbers'
    });
  }
};

/**
 * @desc    Get all barbers
 * @route   GET /api/barbers
 * @access  Public
 */
exports.getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find({ status: 'active' }).select('-__v');

    res.status(200).json({
      status: 'success',
      count: barbers.length,
      data: barbers
    });
  } catch (error) {
    console.error('Error in getAllBarbers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barbers'
    });
  }
};

/**
 * @desc    Get barber by shop ID
 * @route   GET /api/barbers/:shopId
 * @access  Public
 */
exports.getBarberByShopId = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Try to find in both Barber and BarberShop collections
    let barber = await Barber.findOne({ shopId });
    let isBarberModel = true;

    if (!barber) {
      barber = await BarberShop.findOne({ shopId });
      isBarberModel = false;
    }

    if (!barber) {
      return res.status(404).json({
        status: 'error',
        message: 'Barber shop not found'
      });
    }

    // Get current queue info
    const queueLength = await Customer.countDocuments({
      shopId: barber.shopId,
      status: { $in: ['waiting', 'in-service'] }
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...barber.toObject(),
        currentQueueLength: queueLength,
        // Ensure isOpen is explicitly returned (some models might rely on operating hours otherwise)
        isOpen: barber.isOpen
      }
    });
  } catch (error) {
    console.error('Error in getBarberByShopId:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barber details'
    });
  }
};

/**
 * @desc    Update barber shop information
 * @route   PATCH /api/barbers/:shopId
 * @access  Protected (barber owner only)
 */
exports.updateBarber = async (req, res) => {
  try {
    const { shopId } = req.params;
    const updates = req.body;

    // Prevent updating critical fields
    delete updates.shopId;
    delete updates._id;

    const barber = await Barber.findOneAndUpdate(
      { shopId },
      updates,
      { new: true, runValidators: true }
    );

    if (!barber) {
      return res.status(404).json({
        status: 'error',
        message: 'Barber shop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Barber shop updated successfully',
      data: barber
    });
  } catch (error) {
    console.error('Error in updateBarber:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update barber shop'
    });
  }
};

/**
 * @desc    Toggle shop open/closed status
 * @route   PATCH /api/barbers/:shopId/toggle-status
 * @access  Private (Barber only)
 */
exports.toggleShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { isOpen } = req.body;

    console.log(`🔄 Toggle shop status request: shopId=${shopId}, isOpen=${isOpen}`);

    // Try to find in both Barber and BarberShop collections
    let shop = await Barber.findOne({ shopId });
    let isBarberModel = true;

    if (!shop) {
      shop = await BarberShop.findOne({ shopId });
      isBarberModel = false;
    }

    if (!shop) {
      console.log(`❌ Shop not found: ${shopId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Shop not found'
      });
    }

    console.log(`✅ Found shop: ${shop.shopName || shop.name} in ${isBarberModel ? 'Barber' : 'BarberShop'} collection`);

    // Update status
    shop.isOpen = isOpen;
    await shop.save();

    console.log(`✅ Shop status updated: ${shop.shopName || shop.name} is now ${isOpen ? 'OPEN' : 'CLOSED'}`);

    // Emit real-time update to all customers
    const io = req.app.get('io');
    if (io) {
      const eventData = {
        shopId: shop.shopId,
        shopName: shop.shopName || shop.name,
        isOpen: shop.isOpen
      };
      io.emit('shop-status-changed', eventData);
      console.log(`📢 Broadcasting shop-status-changed:`, eventData);
      console.log(`📊 Connected clients:`, io.engine.clientsCount);
    } else {
      console.warn('⚠️ Socket.io not available - real-time update not sent');
    }

    res.status(200).json({
      status: 'success',
      message: `Shop ${isOpen ? 'opened' : 'closed'} successfully`,
      data: {
        shopId: shop.shopId,
        shopName: shop.shopName || shop.name,
        isOpen: shop.isOpen
      }
    });
  } catch (error) {
    console.error('❌ Error in toggleShopStatus:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to toggle shop status'
    });
  }
};
