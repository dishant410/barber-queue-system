import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Service for Queue Management
 * Handles all HTTP requests to the backend
 */

const queueService = {
  /**
   * Join the queue (requires authentication)
   * @param {Object} customerData - { serviceType, shopId }
   * @returns {Promise} - API response with token number and position
   */
  joinQueue: async (customerData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw { message: 'Please login to join the queue' };
      }

      const response = await axios.post(`${API_URL}/queue/join`, customerData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to join queue' };
    }
  },

  /**
   * Cancel queue entry
   * @param {String} id - Queue entry ID
   * @returns {Promise} - API response
   */
  cancelQueue: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw { message: 'Please login to cancel queue' };
      }

      const response = await axios.delete(`${API_URL}/queue/cancel/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel queue' };
    }
  },

  /**
   * Get current user's active queue status
   * @returns {Promise} - Active queue entry or null
   */
  getMyQueueStatus: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { status: 'success', data: null };
      }

      const response = await axios.get(`${API_URL}/queue/my-queue`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch queue status' };
    }
  },

  /**
   * Get customer status
   * @param {String} id - Customer ID or token number
   * @returns {Promise} - Customer data with queue position
   */
  getCustomerStatus: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/queue/status/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch status' };
    }
  },

  /**
   * Get current queue list
   * @param {String} shopId - Optional shop ID to filter queue
   * @returns {Promise} - Array of customers in queue
   */
  getQueue: async (shopId = null) => {
    try {
      const params = shopId ? { shopId } : {};
      const response = await axios.get(`${API_URL}/queue/list`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch queue' };
    }
  },

  /**
   * Start serving a customer
   * @param {String} id - Customer ID
   * @returns {Promise} - Updated customer data
   */
  serveCustomer: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/queue/serve/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start service' };
    }
  },

  /**
   * Complete service for a customer
   * @param {String} id - Customer ID
   * @returns {Promise} - Updated customer data
   */
  completeService: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/queue/complete/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete service' };
    }
  },

  /**
   * Get queue statistics
   * @param {String} shopId - Optional shop ID to filter stats
   * @returns {Promise} - Queue stats (waiting, in-service, completed)
   */
  getQueueStats: async (shopId = null) => {
    try {
      const params = shopId ? { shopId } : {};
      const response = await axios.get(`${API_URL}/queue/stats`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  /**
   * Get nearby barbers based on user location
   * @param {Number} latitude - User's latitude
   * @param {Number} longitude - User's longitude
   * @param {Number} radius - Search radius in meters (default 5000m = 5km)
   * @returns {Promise} - Array of nearby barbers with distance and queue info
   */
  getNearbyBarbers: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/nearby`, {
        params: { latitude, longitude, radius }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch nearby barbers' };
    }
  },

  /**
   * Get all barbers
   * @returns {Promise} - Array of all barbers
   */
  getAllBarbers: async () => {
    try {
      const response = await axios.get(`${API_URL}/barbers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch barbers' };
    }
  },

  /**
   * Get barber details by shop ID
   * @param {String} shopId - Shop ID
   * @returns {Promise} - Barber shop details
   */
  getBarberDetails: async (shopId) => {
    try {
      const response = await axios.get(`${API_URL}/barbers/${shopId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch barber details' };
    }
  },

  /**
   * Register a new barber shop
   * @param {Object} barberData - Barber shop information
   * @returns {Promise} - Registered barber data
   */
  registerBarber: async (barberData) => {
    try {
      const response = await axios.post(`${API_URL}/barbers/register`, barberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register barber' };
    }
  }
};

export default queueService;
