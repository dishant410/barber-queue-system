import React, { useState, useEffect } from 'react';
import queueService from '../services/queueService';
import '../styles/CustomerStatus.css';

/**
 * CustomerStatus Component
 * Allows customers to check their queue status
 */
const CustomerStatus = () => {
  const [tokenNumber, setTokenNumber] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh queue status every 30 seconds
  useEffect(() => {
    let interval;
    if (autoRefresh && customerData) {
      interval = setInterval(() => {
        checkStatus(customerData._id, true);
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, customerData]);

  // Check status function
  const checkStatus = async (id = tokenNumber, silent = false) => {
    if (!id) return;
    
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await queueService.getCustomerStatus(id);
      setCustomerData(response.data);
      setAutoRefresh(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch status');
      setCustomerData(null);
      setAutoRefresh(false);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    checkStatus();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      waiting: { text: 'Waiting', class: 'badge-waiting' },
      'in-service': { text: 'In Service', class: 'badge-service' },
      completed: { text: 'Completed', class: 'badge-completed' },
      cancelled: { text: 'Cancelled', class: 'badge-cancelled' }
    };
    return badges[status] || badges.waiting;
  };

  return (
    <div className="customer-status-container">
      <div className="status-card">
        <h1>Check Queue Status</h1>
        <p className="subtitle">Enter your token number to see your position</p>

        <form onSubmit={handleSubmit} className="status-form">
          <div className="form-group">
            <input
              type="text"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              placeholder="Enter token number"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {customerData && (
          <div className="status-details">
            <div className="status-header">
              <h2>Hello, {customerData.name}!</h2>
              <span className={`status-badge ${getStatusBadge(customerData.status).class}`}>
                {getStatusBadge(customerData.status).text}
              </span>
            </div>

            <div className="token-display-large">
              <span className="label">Your Token</span>
              <span className="token-number">{customerData.tokenNumber}</span>
            </div>

            {customerData.status === 'waiting' && (
              <div className="queue-details">
                <div className="detail-card">
                  <div className="detail-icon">👥</div>
                  <div className="detail-content">
                    <span className="detail-label">Position in Queue</span>
                    <span className="detail-value">{customerData.queuePosition}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon">⏱️</div>
                  <div className="detail-content">
                    <span className="detail-label">Estimated Wait</span>
                    <span className="detail-value">{customerData.estimatedWaitTime} min</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon">✂️</div>
                  <div className="detail-content">
                    <span className="detail-label">Service Type</span>
                    <span className="detail-value capitalize">{customerData.serviceType.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            )}

            {customerData.status === 'in-service' && (
              <div className="status-message in-service">
                <h3>🪒 You're Being Served!</h3>
                <p>Please proceed to the barber chair</p>
              </div>
            )}

            {customerData.status === 'completed' && (
              <div className="status-message completed">
                <h3>✅ Service Completed</h3>
                <p>Thank you for your visit! See you next time.</p>
              </div>
            )}

            <div className="refresh-info">
              <small>
                {autoRefresh && customerData.status === 'waiting' 
                  ? '🔄 Auto-refreshing every 30 seconds' 
                  : 'Status will update automatically'}
              </small>
            </div>

            <button 
              className="btn-secondary"
              onClick={() => {
                setCustomerData(null);
                setTokenNumber('');
                setAutoRefresh(false);
              }}
            >
              Check Another Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerStatus;
