import React, { useState } from 'react';
import authService from '../services/authService';
import '../styles/Registration.css';

/**
 * BarberRegistration Component
 * Handles barber shop registration for admin verification
 */
const BarberRegistration = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    location: {
      coordinates: [0, 0] // Will be updated with actual location
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          });
          setLocationLoading(false);
          alert(`Location captured successfully!\nLatitude: ${position.coords.latitude}\nLongitude: ${position.coords.longitude}`);
        },
        (error) => {
          setLocationLoading(false);
          setError('Unable to get location. Please enable location services.');
        }
      );
    } else {
      setLocationLoading(false);
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.shopName.length < 2) {
      setError('Please enter a valid shop name');
      setLoading(false);
      return;
    }

    if (formData.ownerName.length < 2) {
      setError('Please enter a valid owner name');
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    if (!formData.address.city) {
      setError('Please enter your city');
      setLoading(false);
      return;
    }

    if (formData.location.coordinates[0] === 0 && formData.location.coordinates[1] === 0) {
      setError('Please capture your shop location using the "Get Location" button');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.barberSignup(formData);
      
      if (response.status === 'success') {
        setSuccess(true);
        setFormData({
          shopName: '',
          ownerName: '',
          email: '',
          password: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          location: {
            coordinates: [0, 0]
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-container">
        <div className="registration-content">
          <div className="success-card">
            <div className="success-icon">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2>Registration Submitted!</h2>
            <p className="success-message">
              Thank you for registering your barber shop with QueueCut. Your registration has been submitted successfully.
            </p>
            <div className="info-box">
              <strong>What's Next?</strong>
              <p>Our team will verify your shop details and contact you within 24-48 hours at the email address provided. Once verified, you'll receive your login credentials to access the barber dashboard.</p>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => setSuccess(false)}
            >
              Register Another Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container">
      <div className="registration-content">
        <div className="registration-header">
          <h1 className="app-title">QueueCut</h1>
          <p className="subtitle">Barber Shop Registration</p>
        </div>

        <div className="registration-card">
          <div className="card-header">
            <div className="header-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>Register Your Barber Shop</h2>
            <p>Fill in the details below to register your shop for verification</p>
          </div>

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-section">
              <h3>Shop Information</h3>
              
              <div className="form-group">
                <label>Shop Name *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="e.g., Elite Cuts Salon"
                  required
                />
              </div>

              <div className="form-group">
                <label>Owner Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner's full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="shop@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password (min 6 characters)"
                  minLength="6"
                  required
                />
                <small className="helper-text">You'll use this to login after verification</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Shop Address</h3>
              
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Enter street address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Shop Location</h3>
              <p className="section-description">
                We need your exact location to help customers find your shop
              </p>
              
              <button 
                type="button" 
                className="btn-location" 
                onClick={getLocation}
                disabled={locationLoading}
              >
                {locationLoading ? 'Getting Location...' : 
                  (formData.location.coordinates[0] !== 0 ? '✓ Location Captured' : 'Get My Location')}
              </button>
              
              {formData.location.coordinates[0] !== 0 && (
                <div className="location-info">
                  <small>
                    Latitude: {formData.location.coordinates[1].toFixed(6)}, 
                    Longitude: {formData.location.coordinates[0].toFixed(6)}
                  </small>
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>

            <div className="info-box">
              <strong>Note:</strong> Your registration will be reviewed by our admin team. 
              You'll receive login credentials via email once your shop is verified (usually within 24-48 hours).
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BarberRegistration;
