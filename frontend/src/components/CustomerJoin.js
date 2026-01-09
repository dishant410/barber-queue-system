import React, { useState } from 'react';
import queueService from '../services/queueService';
import '../styles/CustomerJoin.css';

/**
 * CustomerJoin Component
 * Allows customers to join the barber queue
 */
const CustomerJoin = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceType: 'haircut'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await queueService.joinQueue(formData);
      setSuccess(response.data);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        serviceType: 'haircut'
      });
    } catch (err) {
      setError(err.message || 'Failed to join queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-join-container">
      <div className="customer-join-card">
        <h1>Join the Queue</h1>
        <p className="subtitle">Skip the wait. Join our virtual queue now!</p>

        {!success ? (
          <form onSubmit={handleSubmit} className="join-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                minLength="2"
                maxLength="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serviceType">Service Type</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
              >
                <option value="haircut">Haircut</option>
                <option value="shave">Shave</option>
                <option value="haircut-shave">Haircut + Shave</option>
                <option value="styling">Hair Styling</option>
                <option value="other">Other</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Queue'}
            </button>
          </form>
        ) : (
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2>You're in the Queue!</h2>
            
            <div className="token-display">
              <div className="token-number">
                <span className="label">Token Number</span>
                <span className="value">{success.tokenNumber}</span>
              </div>
            </div>

            <div className="queue-info">
              <div className="info-item">
                <span className="info-label">Position in Queue</span>
                <span className="info-value">{success.queuePosition}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estimated Wait</span>
                <span className="info-value">{success.estimatedWaitTime} min</span>
              </div>
            </div>

            <p className="info-text">
              We'll call your token number when it's your turn. 
              Please be available when your number is called.
            </p>

            <button 
              className="btn-secondary"
              onClick={() => setSuccess(null)}
            >
              Add Another Person
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerJoin;
