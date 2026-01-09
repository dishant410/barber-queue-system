import io from 'socket.io-client';

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Strip '/api' suffix and trailing slash if present to get the base server URL
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

const SOCKET_URL = getSocketUrl();
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

/**
 * Real-time Service with WebSocket and Polling Fallback
 * Handles real-time queue updates with offline support
 */
class RealtimeService {
  constructor() {
    this.socket = null;
    this.pollingIntervals = {};
    this.isConnected = false;
    this.usePolling = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize Socket.IO connection with fallback to polling
   */
  connect() {
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.usePolling = false;
        this.reconnectAttempts = 0;
        this.stopAllPolling();
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ WebSocket disconnected:', reason);
        this.isConnected = false;

        // Switch to polling fallback
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('🔄 Switching to polling fallback');
          this.usePolling = true;
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('🔄 Max reconnect attempts reached. Using polling fallback.');
          this.usePolling = true;
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.usePolling = false;
        this.reconnectAttempts = 0;
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      this.usePolling = true;
      return null;
    }
  }

  /**
   * Subscribe to queue updates with fallback
   * @param {String} shopId - Barber shop ID
   * @param {Function} callback - Called with queue updates
   */
  subscribeToQueue(shopId, callback) {
    if (!shopId || !callback) {
      console.error('shopId and callback are required');
      return;
    }

    if (this.isConnected && !this.usePolling) {
      // Use WebSocket
      this.socket.emit('join-shop', shopId);
      this.socket.on('queue-update', callback);
      console.log(`📡 Subscribed to queue updates for shop-${shopId} via WebSocket`);
    } else {
      // Fallback to polling
      this.startPolling(shopId, callback);
      console.log(`🔄 Subscribed to queue updates for ${shopId} via polling`);
    }
  }

  /**
   * Join a shop room for real-time updates
   * @param {String} shopId - Barber shop ID
   */
  joinShop(shopId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('join-shop', shopId);
      console.log(`🏪 Joined shop room: ${shopId}`);
    }
  }

  /**
   * Listen for queue updates
   * @param {Function} callback - Called with queue update data
   */
  onQueueUpdate(callback) {
    if (this.isConnected && this.socket) {
      this.socket.on('queue-update', callback);
    }
  }

  /**
   * Listen for shop status changes
   * @param {Function} callback - Called with shop status change data
   */
  onShopStatusChange(callback) {
    // Ensure socket is initialized
    if (!this.socket) {
      this.connect();
    }

    // Remove any existing listener first to avoid duplicates
    this.socket.off('shop-status-changed');

    // Add new listener
    this.socket.on('shop-status-changed', (data) => {
      console.log('📢 Received shop-status-changed event:', data);
      callback(data);
    });

    console.log('👂 Listening for shop-status-changed events');
    return true;
  }

  /**
   * Unsubscribe from queue updates
   * @param {String} shopId - Barber shop ID
   */
  unsubscribeFromQueue(shopId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('leave-queue', shopId);
      this.socket.off(`queue-update-${shopId}`);
    }

    this.stopPolling(shopId);
    console.log(`🔌 Unsubscribed from queue updates for ${shopId}`);
  }

  /**
   * Start polling for a specific shop
   * @param {String} shopId - Barber shop ID
   * @param {Function} callback - Called with updates
   */
  startPolling(shopId, callback) {
    // Clear existing polling interval
    this.stopPolling(shopId);

    // Start new polling interval
    this.pollingIntervals[shopId] = setInterval(async () => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/queue/${shopId}`);
        if (response.ok) {
          const data = await response.json();
          callback(data);
        }
      } catch (error) {
        console.warn(`Polling error for ${shopId}:`, error.message);
      }
    }, POLLING_INTERVAL);
  }

  /**
   * Stop polling for a specific shop
   * @param {String} shopId - Barber shop ID
   */
  stopPolling(shopId) {
    if (this.pollingIntervals[shopId]) {
      clearInterval(this.pollingIntervals[shopId]);
      delete this.pollingIntervals[shopId];
    }
  }

  /**
   * Stop all polling intervals
   */
  stopAllPolling() {
    Object.keys(this.pollingIntervals).forEach(shopId => {
      this.stopPolling(shopId);
    });
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.stopAllPolling();
    this.isConnected = false;
    console.log('🔌 Disconnected from real-time service');
  }

  /**
   * Check connection status
   * @returns {Boolean}
   */
  isSocketConnected() {
    return this.isConnected && !this.usePolling;
  }

  /**
   * Get connection mode
   * @returns {String} - 'websocket', 'polling', or 'offline'
   */
  getConnectionMode() {
    if (this.isConnected && !this.usePolling) {
      return 'websocket';
    } else if (this.usePolling || !navigator.onLine) {
      return 'polling';
    }
    return 'offline';
  }

  /**
   * Emit custom event
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  }

  /**
   * Listen to custom event
   * @param {String} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param {String} event - Event name
   * @param {Function} callback - Event handler (optional)
   */
  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

// Export singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
