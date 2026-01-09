import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Cache keys for localStorage
const CACHE_KEYS = {
  NEARBY_BARBERS: 'queuecut_nearby_barbers',
  USER_LOCATION: 'queuecut_user_location',
  LAST_FETCH: 'queuecut_last_fetch'
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Location Service for Barber Shop Discovery
 * Handles geolocation, barber shop fetching, and offline support
 */

const locationService = {
  /**
   * Get user's current location using browser Geolocation API
   * @param {String} userId - Optional user ID for user-specific caching
   * @returns {Promise<Object>} - { latitude, longitude }
   */
  getCurrentLocation: (userId = null) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      // Try to get cached location first for faster response (user-specific)
      const cachedLocation = locationService.getCachedLocation(userId);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          // Cache the location (user-specific if userId provided)
          const cacheKey = userId ? `${CACHE_KEYS.USER_LOCATION}_${userId}` : CACHE_KEYS.USER_LOCATION;
          localStorage.setItem(cacheKey, JSON.stringify({
            ...location,
            timestamp: Date.now()
          }));

          resolve(location);
        },
        (error) => {
          // If GPS fails but we have cached location for this user, use it
          if (cachedLocation) {
            console.warn('Using cached location due to GPS error:', error.message);
            resolve({
              ...cachedLocation,
              isCached: true,
              error: error.message
            });
            return;
          }

          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true, // Use GPS for accurate location
          timeout: 30000,
          maximumAge: 0 // Force fresh location, no cache
        }
      );
    });
  },

  /**
   * Get cached user location (user-specific)
   * @param {String} userId - Optional user ID to get user-specific cache
   * @returns {Object|null}
   */
  getCachedLocation: (userId = null) => {
    try {
      // Use user-specific cache key if userId provided
      const cacheKey = userId ? `${CACHE_KEYS.USER_LOCATION}_${userId}` : CACHE_KEYS.USER_LOCATION;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { latitude, longitude, accuracy, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Return location if less than 10 minutes old
      if (age < 10 * 60 * 1000) {
        return { latitude, longitude, accuracy };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Watch user's location changes (real-time tracking)
   * @param {Function} callback - Called with new location
   * @returns {Number} - Watch ID (use to stop watching)
   */
  watchLocation: (callback) => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  },

  /**
   * Stop watching location
   * @param {Number} watchId - Watch ID returned by watchLocation
   */
  stopWatchingLocation: (watchId) => {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  /**
   * Get nearby barber shops with offline fallback
   * @param {Number} latitude - User's latitude
   * @param {Number} longitude - User's longitude
   * @param {Number} radius - Search radius in meters (default 5000m = 5km as per requirements)
   * @returns {Promise} - Nearby barber shops
   */
  getNearbyBarbers: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/nearby`, {
        params: { lat: latitude, lng: longitude, radius },
        timeout: 10000 // 10 second timeout
      });

      // Cache the successful response
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        location: { latitude, longitude }
      };
      localStorage.setItem(CACHE_KEYS.NEARBY_BARBERS, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString());

      return response.data;
    } catch (error) {
      console.warn('Network error, attempting to use cached data:', error.message);

      // Try to use cached data if available
      const cachedData = locationService.getCachedBarbers();
      if (cachedData) {
        // Add offline indicator
        return {
          ...cachedData,
          isOffline: true,
          offlineMessage: 'Showing cached data. Last updated: ' + locationService.getTimeSinceLastFetch()
        };
      }

      // No cache available, throw error
      throw error.response?.data || { message: 'Failed to fetch nearby barbers. Please check your connection.' };
    }
  },

  /**
   * Get cached barbers from localStorage
   * @returns {Object|null} - Cached data or null if expired/unavailable
   */
  getCachedBarbers: () => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.NEARBY_BARBERS);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Return cached data even if expired (for offline mode)
      // But mark it as potentially stale
      return {
        ...data,
        isCached: true,
        cacheAge: age,
        isStale: age > CACHE_EXPIRY_MS
      };
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  },

  /**
   * Clear cached data
   */
  clearCache: () => {
    localStorage.removeItem(CACHE_KEYS.NEARBY_BARBERS);
    localStorage.removeItem(CACHE_KEYS.LAST_FETCH);
  },

  /**
   * Get time since last successful fetch
   * @returns {String} - Human-readable time string
   */
  getTimeSinceLastFetch: () => {
    const lastFetch = localStorage.getItem(CACHE_KEYS.LAST_FETCH);
    if (!lastFetch) return 'Unknown';

    const minutes = Math.floor((Date.now() - parseInt(lastFetch)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  },

  /**
   * Check if online
   * @returns {Boolean}
   */
  isOnline: () => {
    return navigator.onLine;
  },

  /**
   * Get nearby barbers with filters and offline support
   * @param {Object} params - { latitude, longitude, isOpen, services, minRating, radius }
   * @returns {Promise} - Filtered barber shops
   */
  getNearbyBarbersWithFilters: async (params) => {
    try {
      const { latitude, longitude, isOpen, services, minRating, radius } = params;
      const response = await axios.get(`${API_URL}/barbers/nearby/filter`, {
        params: {
          lat: latitude,
          lng: longitude,
          isOpen,
          services: services?.join(','),
          minRating,
          radius: radius || 2000
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      // Try cached data with client-side filtering
      const cachedData = locationService.getCachedBarbers();
      if (cachedData && cachedData.data) {
        const filtered = cachedData.data.filter(barber => {
          if (isOpen !== undefined && barber.isOpen !== isOpen) return false;
          if (minRating && barber.rating < minRating) return false;
          if (services && services.length > 0) {
            const hasService = services.some(s => barber.services?.includes(s));
            if (!hasService) return false;
          }
          return true;
        });

        return {
          ...cachedData,
          data: filtered,
          isOffline: true,
          offlineMessage: 'Showing filtered cached data'
        };
      }

      throw error.response?.data || { message: 'Failed to fetch barbers' };
    }
  },

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {Number} lat1 - Latitude 1
   * @param {Number} lon1 - Longitude 1
   * @param {Number} lat2 - Latitude 2
   * @param {Number} lon2 - Longitude 2
   * @returns {Number} - Distance in kilometers
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100;
  },

  /**
   * Check if user has moved significantly (>300 meters)
   * @param {Object} oldLocation - { latitude, longitude }
   * @param {Object} newLocation - { latitude, longitude }
   * @returns {Boolean} - True if moved significantly
   */
  hasMovedSignificantly: (oldLocation, newLocation, threshold = 0.3) => {
    if (!oldLocation || !newLocation) return true;

    const distance = locationService.calculateDistance(
      oldLocation.latitude,
      oldLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    return distance >= threshold; // 300 meters
  }
};

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export default locationService;
