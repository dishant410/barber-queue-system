import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Auth.css';

/**
 * BarberAuth Component
 * Handles barber login only (signup done via admin link)
 */
const BarberAuth = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login only
      const response = await authService.barberLogin({
        email: formData.email,
        password: formData.password
      });
      
      if (response.status === 'success') {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-container">
      <div className="auth-content">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to home
        </button>

        <div className="auth-card">
          <div className="auth-icon barber-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>

          <h2>Barber Login</h2>
          <p className="auth-subtitle">Sign in to manage your shop queue</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength="6"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </button>

            <div className="info-box" style={{marginTop: '20px'}}>
              <strong>New Barber Shop?</strong> Shop registration requires verification. 
              Please contact admin at <a href="mailto:queuecut.barber.register@gmail.com" style={{color: '#34d399'}}>queuecut.barber.register@gmail.com</a> to register your shop.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BarberAuth;