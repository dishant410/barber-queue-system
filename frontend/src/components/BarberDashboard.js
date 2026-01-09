import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import queueService from '../services/queueService';
import realtimeService from '../services/realtimeService';
import barberService from '../services/barberService';
import authService from '../services/authService';
import '../styles/BarberDashboard.css';

/**
 * BarberDashboard Component
 * Main interface for barbers to manage the queue
 */
const BarberDashboard = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [shopStatus, setShopStatus] = useState({ isOpen: true, loading: false });

  // Fetch queue and stats on component mount
  useEffect(() => {
    fetchQueueData();

    // Connect to real-time updates
    realtimeService.connect();

    // Join shop room for real-time updates (use actual shopId from user)
    const user = authService.getCurrentUser();
    const shopId = user?.shopId || 'main-shop';
    realtimeService.joinShop(shopId);

    // Listen for queue updates
    realtimeService.onQueueUpdate((data) => {
      console.log('📢 Real-time queue update:', data);
      // Refresh queue data when update received
      fetchQueueData();
    });

    // Fallback: Auto-refresh every 30 seconds (reduced from 10s since we have real-time)
    const interval = setInterval(fetchQueueData, 30000);

    return () => {
      clearInterval(interval);
      realtimeService.disconnect();
    };
  }, []);

  // Fetch queue and statistics
  const fetchQueueData = async () => {
    try {
      const user = authService.getCurrentUser();
      const shopId = user?.shopId || null;

      const promises = [
        queueService.getQueue(shopId),
        queueService.getQueueStats(shopId)
      ];

      // If we have a shopId, fetch the latest shop details to sync status
      if (user && user.shopId) {
        promises.push(barberService.getBarberByShopId(user.shopId));
      }

      const results = await Promise.all(promises);
      const queueResponse = results[0];
      const statsResponse = results[1];
      const shopResponse = results[2];

      setQueue(queueResponse.data);
      setStats(statsResponse.data);

      // Update shop status if we got response
      if (shopResponse && shopResponse.data) {
        console.log('🔄 Synced shop status:', shopResponse.data.isOpen);
        setShopStatus(prev => ({
          ...prev,
          isOpen: !!shopResponse.data.isOpen,
          loading: false
        }));
      }

      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      // Don't show error if just shop status failed (graceful degradation)
      if (!queue.length) {
        setError(err.message || 'Failed to fetch queue data');
      }
      setShopStatus(prev => ({ ...prev, loading: false }));
    } finally {
      setLoading(false);
    }
  };

  // Start serving a customer
  const handleServeCustomer = async (customerId) => {
    setActionLoading(customerId);
    try {
      await queueService.serveCustomer(customerId);
      await fetchQueueData();
    } catch (err) {
      alert(err.message || 'Failed to start service');
    } finally {
      setActionLoading(null);
    }
  };

  // Complete service for a customer
  const handleCompleteService = async (customerId) => {
    setActionLoading(customerId);
    try {
      await queueService.completeService(customerId);
      await fetchQueueData();
    } catch (err) {
      alert(err.message || 'Failed to complete service');
    } finally {
      setActionLoading(null);
    }
  };

  // Format time display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get next customer to serve
  const getNextCustomer = () => {
    return queue.find(c => c.status === 'waiting');
  };

  // Toggle shop open/closed status
  const handleToggleShopStatus = async () => {
    setShopStatus(prev => ({ ...prev, loading: true }));
    try {
      const user = authService.getCurrentUser();
      console.log('👤 Current user:', user);

      if (!user) {
        alert('Please login again');
        setShopStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      if (!user.shopId) {
        alert('Shop ID not found. User data: ' + JSON.stringify(user));
        setShopStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const newStatus = !shopStatus.isOpen;
      console.log('🔄 Toggling status to:', newStatus);

      const response = await barberService.toggleShopStatus(user.shopId, newStatus);

      setShopStatus({ isOpen: newStatus, loading: false });
      alert(`Shop ${newStatus ? 'opened' : 'closed'} successfully!`);
    } catch (err) {
      console.error('❌ Toggle error:', err);
      alert(err.message || 'Failed to toggle shop status');
      setShopStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.barberLogout();
      navigate('/barber-auth');
    } catch (err) {
      console.error('Logout error:', err);
      // Still navigate even if API call fails
      navigate('/barber-auth');
    }
  };

  if (loading) {
    return (
      <div className="barber-dashboard">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="barber-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Barber Dashboard</h1>
          <div className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="header-right">
          <button
            className={`shop-status-toggle ${shopStatus.isOpen ? 'open' : 'closed'}`}
            onClick={handleToggleShopStatus}
            disabled={shopStatus.loading}
          >
            {shopStatus.loading ? (
              'Updating...'
            ) : (
              <>
                <span className="status-indicator"></span>
                {shopStatus.isOpen ? 'Shop Open - Click to Close' : 'Shop Closed - Click to Open'}
              </>
            )}
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card waiting">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-value">{stats.waiting}</span>
              <span className="stat-label">Waiting</span>
            </div>
          </div>

          <div className="stat-card in-service">
            <div className="stat-icon">✂️</div>
            <div className="stat-content">
              <span className="stat-value">{stats.inService}</span>
              <span className="stat-label">In Service</span>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <span className="stat-value">{stats.completedToday}</span>
              <span className="stat-label">Completed Today</span>
            </div>
          </div>

          <div className="stat-card wait-time">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <span className="stat-value">{stats.estimatedWaitTime}</span>
              <span className="stat-label">Est. Wait (min)</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Customer Card */}
      {getNextCustomer() && (
        <div className="next-customer-card">
          <h2>Next Customer</h2>
          <div className="next-customer-info">
            <div className="customer-token">#{getNextCustomer().tokenNumber}</div>
            <div className="customer-details">
              <p className="customer-name">{getNextCustomer().name}</p>
              <p className="customer-service">{getNextCustomer().serviceType.replace('-', ' ')}</p>
            </div>
            <button
              className="btn-serve"
              onClick={() => handleServeCustomer(getNextCustomer()._id)}
              disabled={actionLoading === getNextCustomer()._id}
            >
              {actionLoading === getNextCustomer()._id ? 'Processing...' : 'Start Service'}
            </button>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="queue-section">
        <h2>Current Queue ({queue.length})</h2>

        {queue.length === 0 ? (
          <div className="empty-queue">
            <p>No customers in queue</p>
            <span>🎉</span>
          </div>
        ) : (
          <div className="queue-list">
            {queue.map((customer) => (
              <div
                key={customer._id}
                className={`queue-item ${customer.status}`}
              >
                <div className="queue-item-header">
                  <div className="token-badge">#{customer.tokenNumber}</div>
                  <span className={`status-indicator ${customer.status}`}>
                    {customer.status === 'waiting' && '⏳ Waiting'}
                    {customer.status === 'in-service' && '✂️ In Service'}
                  </span>
                </div>

                <div className="queue-item-body">
                  <div className="customer-info">
                    <h3>{customer.name}</h3>
                    <p className="phone">{customer.phone}</p>
                  </div>

                  <div className="service-info">
                    <div className="info-row">
                      <span className="label">Service:</span>
                      <span className="value capitalize">
                        {customer.serviceType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Joined:</span>
                      <span className="value">{formatTime(customer.joinedAt)}</span>
                    </div>
                    {customer.queuePosition > 0 && (
                      <div className="info-row">
                        <span className="label">Position:</span>
                        <span className="value">{customer.queuePosition}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="queue-item-actions">
                  {customer.status === 'waiting' && (
                    <button
                      className="btn-action btn-serve-small"
                      onClick={() => handleServeCustomer(customer._id)}
                      disabled={actionLoading === customer._id}
                    >
                      {actionLoading === customer._id ? '...' : 'Serve'}
                    </button>
                  )}
                  {customer.status === 'in-service' && (
                    <button
                      className="btn-action btn-complete"
                      onClick={() => handleCompleteService(customer._id)}
                      disabled={actionLoading === customer._id}
                    >
                      {actionLoading === customer._id ? '...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarberDashboard;
