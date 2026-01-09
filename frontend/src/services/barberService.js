import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Service for Barber Shop Location-based Operations
 * Handles geolocation and barber shop discovery
 */

const barberService = {
  /**
   * Get nearby barber shops based on user's location
   * @param {Number} latitude - User's latitude
   * @param {Number} longitude - User's longitude
   * @param {Number} radius - Search radius in kilometers (default: 5km)
   * @returns {Promise} - Array of nearby barber shops with distance
   */
  getNearbyBarbers: async (latitude, longitude, radius = 5) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/nearby`, {
        params: {
          lat: latitude,
          lng: longitude,
          radius: radius // in km, backend will convert to meters
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch nearby barbers' };
    }
  },

  /**
   * Register a new barber shop
   * @param {Object} shopData - Barber shop registration data
   * @returns {Promise} - Created barber shop data
   */
  registerBarberShop: async (shopData) => {
    try {
      const response = await axios.post(`${API_URL}/barbers/register`, shopData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register barber shop' };
    }
  },

  /**
   * Toggle shop open/closed status
   * @param {String} shopId - Shop ID
   * @param {Boolean} isOpen - New open status
   * @returns {Promise} - Updated shop data
   */
  toggleShopStatus: async (shopId, isOpen) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Toggling shop status:', { shopId, isOpen, hasToken: !!token });

      const response = await axios.patch(
        `${API_URL}/barbers/${shopId}/toggle-status`,
        { isOpen },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('✅ Toggle success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Toggle error:', error.response?.data || error.message);
      throw error.response?.data || { message: 'Failed to toggle shop status' };
    }
  },

  /**
   * Get all barber shops
   * @param {Boolean} activeOnly - Filter for active shops only
   * @returns {Promise} - Array of barber shops
   */
  getAllBarbers: async (activeOnly = true) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/list`, {
        params: activeOnly ? { active: true } : {}
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch barber shops' };
    }
  },

  /**
   * Get barber shop by MongoDB ID
   * @param {String} id - Barber shop MongoDB ID
   * @returns {Promise} - Barber shop data
   */
  getBarberById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch barber shop' };
    }
  },

  /**
   * Get barber shop by custom Shop ID
   * @param {String} shopId - Unique Shop ID
   * @returns {Promise} - Barber shop data
   */
  getBarberByShopId: async (shopId) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/shop/${shopId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch barber shop' };
    }
  }
};

export default barberService;
