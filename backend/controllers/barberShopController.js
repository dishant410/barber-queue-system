const BarberShop = require('../models/BarberShop');
const Barber = require('../models/Barber');
const Customer = require('../models/Customer');

/**
 * Controller for Barber Shop Location-based Operations
 * Handles geospatial queries and barber shop management
 */

/**
 * @desc    Get nearby barber shops based on user's location (DYNAMIC - works anywhere)
 * @route   GET /api/barbers/nearby?lat=<latitude>&lng=<longitude>&radius=<radius>
 * @access  Public
 * @default 5 km radius (5000 meters)
 */
exports.getNearbyBarbers = async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, radius } = req.query;

    // Support both lat/lng and latitude/longitude
    const userLat = parseFloat(lat || latitude);
    const userLon = parseFloat(lng || longitude);

    // Validate required parameters
    if (!userLat || !userLon || isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid latitude and longitude are required'
      });
    }

    // Validate coordinates
    if (userLat < -90 || userLat > 90 || userLon < -180 || userLon > 180) {
      return res.status(400).json({
        status: 'error',
        message: 'Coordinates out of valid range'
      });
    }

    // Set maximum distance (default 5000m = 5km as per requirements)
    const maxDistance = radius ? parseInt(radius) : 5000;

    console.log(`🔍 Searching for barbers near: ${userLat}, ${userLon} within ${maxDistance}m (${(maxDistance/1000).toFixed(1)} km)`);

    // Search Barber collection (registered via auth) - EXCLUDE TEST DATA
    const barbersPromise = Barber.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLon, userLat]
          },
          $maxDistance: maxDistance
        }
      },
      status: 'active',
      isTestData: { $ne: true } // Exclude test/dummy data
    }).limit(50);

    // Search BarberShop collection (manually registered shops) - EXCLUDE TEST DATA
    const shopsPromise = BarberShop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLon, userLat]
          },
          $maxDistance: maxDistance
        }
      },
      isActive: true,
      isTestData: { $ne: true } // Exclude test/dummy data
    }).limit(50);

    const [barbers, shops] = await Promise.all([barbersPromise, shopsPromise]);

    const nearbyBarbers = [...barbers, ...shops];

    console.log(`✅ Found ${barbers.length} from Barber and ${shops.length} from BarberShop collection`);

    // Enrich with distance and queue info
    const enrichedBarbers = await Promise.all(
      nearbyBarbers.map(async (shop) => {
        // Check which model it is
        const isBarberModel = shop.role !== undefined; // Barber model has role field

        // Calculate distance
        const distance = shop.getDistance(userLon, userLat);

        // Get current queue
        const queueLength = await Customer.countDocuments({
          shopId: shop.shopId,
          status: { $in: ['waiting', 'in-service'] }
        });

        // Calculate ETA
        const estimatedWaitTime = queueLength * 15; // 15 min average per customer

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

        // Check if shop is currently open
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const openingTime = isBarberModel ? (shop.openingTime || '09:00') : (shop.operatingHours?.opening || '09:00');
        const closingTime = isBarberModel ? (shop.closingTime || '20:00') : (shop.operatingHours?.closing || '20:00');

        // Check both time-based and manual open/close toggle
        const isWithinHours = currentTime >= openingTime && currentTime <= closingTime;
        const isOpen = shop.isOpen !== undefined ? shop.isOpen : isWithinHours;

        console.log(`🏪 ${shop.shopName || shop.name}: isOpen field=${shop.isOpen}, calculated=${isOpen}, withinHours=${isWithinHours}`);

        // Build address string
        let addressText;
        if (isBarberModel) {
          addressText = shop.address ? `${shop.address.city}, ${shop.address.state || ''}` : 'Address not available';
          if (shop.address?.street) addressText = `${shop.address.street}, ${addressText}`;
        } else {
          addressText = `${shop.address.street}, ${shop.address.city}`;
        }

        return {
          id: shop._id,
          shopId: shop.shopId,
          shopName: shop.shopName || shop.name,
          ownerName: shop.ownerName,
          phone: shop.phone || shop.ownerPhone,
          rating: shop.rating || shop.averageRating || 4.5,
          totalRatings: shop.totalRatings || shop.totalReviews || 0,
          distance: distance,
          distanceText: distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`,
          queueLength: queueLength,
          estimatedWaitTime: estimatedWaitTime,
          waitTimeText: waitTimeText,
          isOpen: isOpen,
          status: 'active',
          services: shop.services || [],
          address: addressText,
          openingTime: openingTime,
          closingTime: closingTime,
          hasParking: shop.hasParking || false,
          hasAC: shop.hasAC || false,
          coordinates: {
            latitude: shop.location.coordinates[1],
            longitude: shop.location.coordinates[0]
          },
          lastUpdated: new Date().toISOString()
        };
      })
    );

    // Sort by distance (nearest first - as per requirements)
    enrichedBarbers.sort((a, b) => a.distance - b.distance);

    // Return optimized response with all required fields:
    // - Shop name, Distance (km), Address, Rating
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
    console.error('❌ Error in getNearbyBarbers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch nearby barber shops',
      error: error.message
    });
  }
};

/**
 * @desc    Register a new barber shop
 * @route   POST /api/barbers/register
 * @access  Public (should be protected in production)
 */
exports.registerBarberShop = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      ownerPhone,
      address,
      latitude,
      longitude,
      services,
      operatingHours
    } = req.body;

    // Validate required fields
    if (!name || !ownerName || !ownerPhone || !address || !latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'All required fields must be provided'
      });
    }

    // Check if shop already exists
    const existingShop = await BarberShop.findOne({ ownerPhone });
    if (existingShop) {
      return res.status(400).json({
        status: 'error',
        message: 'A shop is already registered with this phone number'
      });
    }

    // Generate unique shopId
    const shopId = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new barber shop (real registration, not test data)
    const barberShop = await BarberShop.create({
      name,
      ownerName,
      ownerPhone,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      services: services || ['haircut', 'shave'],
      operatingHours: operatingHours || { opening: '09:00', closing: '20:00' },
      shopId,
      isActive: true,
      isTestData: false // Mark as real data (visible to customers)
    });

    res.status(201).json({
      status: 'success',
      message: 'Barber shop registered successfully',
      data: barberShop
    });
  } catch (error) {
    console.error('Error in registerBarberShop:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to register barber shop'
    });
  }
};

/**
 * @desc    Get all barber shops
 * @route   GET /api/barbers/list
 * @access  Public
 */
exports.getAllBarbers = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const barbers = await Barber.find(filter).select('-password -__v');

    res.status(200).json({
      status: 'success',
      count: barbers.length,
      data: barbers
    });
  } catch (error) {
    console.error('Error in getAllBarbers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barber shops'
    });
  }
};

/**
 * @desc    Get barber shop by ID
 * @route   GET /api/barbers/:id
 * @access  Public
 */
exports.getBarberById = async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id).select('-password -__v');

    if (!barber) {
      return res.status(404).json({
        status: 'error',
        message: 'Barber shop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: barber
    });
  } catch (error) {
    console.error('Error in getBarberById:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch barber shop'
    });
  }
};

/**
 * @desc    Update barber shop location
 * @route   PATCH /api/barbers/:id/location
 * @access  Private (Barber only)
 */
exports.updateBarberLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const barberShop = await BarberShop.findById(id);

    if (!barberShop) {
      return res.status(404).json({
        status: 'error',
        message: 'Barber shop not found'
      });
    }

    // Use GeoJSON format update
    barber.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    await barber.save();

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      data: barber
    });
  } catch (error) {
    console.error('Error in updateBarberLocation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update location'
    });
  }
};

/**
 * @desc    Toggle barber shop active status
 * @route   PATCH /api/barbers/:id/toggle-active
 * @access  Private (Barber only)
 */
exports.toggleBarberActive = async (req, res) => {
  try {
    const { id } = req.params;

    const barberShop = await BarberShop.findById(id);

    if (!barberShop) {
      return res.status(404).json({
        status: 'error',
        message: 'Barber shop not found'
      });
    }

    // Toggle status or isOpen depending on what 'active' means in context
    // Assuming 'status' field for active/inactive shop
    barber.status = barber.status === 'active' ? 'inactive' : 'active';
    await barber.save();

    res.status(200).json({
      status: 'success',
      message: `Shop ${barber.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: barber
    });
  } catch (error) {
    console.error('Error in toggleBarberActive:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update shop status'
    });
  }
};
