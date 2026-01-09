import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGeolocation from '../hooks/useGeolocation';
import locationService from '../services/locationService';
import '../styles/FindBarbers.css';

const FindBarbers = () => {
  const navigate = useNavigate();
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation({}, true);
  
  const [barberShops, setBarberShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5); // Default to 5km - works anywhere globally
  const [manualLocation, setManualLocation] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');

  // Check if customer is authenticated
  useEffect(() => {
    const customerAuth = localStorage.getItem('customerAuth');
    if (!customerAuth) {
      // Redirect to auth if not logged in
      navigate('/customer-auth');
    }
  }, [navigate]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      const currentLocation = manualLocation || location;
      if (currentLocation) {
        fetchNearbyBarbers();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineMessage('You are offline. Showing cached results.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [location, manualLocation]);

  useEffect(() => {
    const currentLocation = manualLocation || location;
    if (currentLocation) {
      fetchNearbyBarbers();
    }
  }, [location, manualLocation, radius]);

  const fetchNearbyBarbers = async () => {
    const currentLocation = manualLocation || location;
    if (!currentLocation) return;

    setLoading(true);
    setError(null);

    try {
      const radiusInMeters = radius * 1000;
      const response = await locationService.getNearbyBarbers(
        currentLocation.latitude,
        currentLocation.longitude,
        radiusInMeters
      );

      // Check for offline mode
      if (response.isOffline || response.isCached) {
        setIsOffline(true);
        setOfflineMessage(response.offlineMessage || 'Showing cached results');
      } else {
        setIsOffline(false);
        setOfflineMessage('');
      }

      setBarberShops(response.data || []);
    } catch (err) {
      console.error('Error fetching barbers:', err);
      
      // Try cached data
      const cachedData = locationService.getCachedBarbers();
      if (cachedData && cachedData.data) {
        setBarberShops(cachedData.data);
        setIsOffline(true);
        setOfflineMessage('Network error. Showing cached results.');
      } else {
        setError(err.message || 'Failed to load nearby barbers');
        setBarberShops([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBarber = (shop) => {
    localStorage.setItem('selectedShop', JSON.stringify(shop));
    navigate('/join', { state: { shop } });
  };

  return (
    <div className="find-barbers-container">
      <div className="find-barbers-content">
        <header className="find-barbers-header">
          <button className="back-button" onClick={() => navigate('/customer-auth')}>
            ← Back
          </button>
          <h1>Find Nearby Barbers</h1>
          <p className="subtitle">Discover barber shops within {radius} km</p>
          
          {/* Offline indicator */}
          {isOffline && (
            <div className="offline-indicator">
              <span className="offline-icon">📡</span>
              <span>{offlineMessage}</span>
            </div>
          )}
        </header>

        <div className="location-section">
          {geoLoading && (
            <div className="location-status loading">
              <div className="spinner"></div>
              <span>Getting your location...</span>
            </div>
          )}

          {geoError && (
            <div className="location-status error">
              <span className="icon">⚠️</span>
              <div>
                <p>{geoError}</p>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                  <button onClick={requestLocation} className="btn-retry">
                    Try Again
                  </button>
                  <button onClick={() => setShowManualInput(true)} className="btn-retry">
                    Enter Manually
                  </button>
                </div>
              </div>
            </div>
          )}

          {showManualInput && !location && (
            <div className="manual-location-input" style={{
              background: '#2a2a2a',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #444'
            }}>
              <h3 style={{marginBottom: '15px', color: '#fff'}}>Enter Your Location</h3>
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <input 
                  type="number" 
                  placeholder="Latitude (e.g., 23.0225)"
                  id="manual-lat"
                  step="0.0001"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#1a1a1a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <input 
                  type="number" 
                  placeholder="Longitude (e.g., 72.5714)"
                  id="manual-lng"
                  step="0.0001"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#1a1a1a',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button 
                  onClick={() => {
                    const lat = parseFloat(document.getElementById('manual-lat').value);
                    const lng = parseFloat(document.getElementById('manual-lng').value);
                    if (lat && lng) {
                      setManualLocation({ latitude: lat, longitude: lng });
                      setShowManualInput(false);
                    } else {
                      alert('Please enter valid coordinates');
                    }
                  }}
                  className="btn-retry"
                  style={{flex: 1}}
                >
                  Search Here
                </button>
                <button 
                  onClick={() => setShowManualInput(false)}
                  className="btn-retry"
                  style={{flex: 1, background: '#444'}}
                >
                  Cancel
                </button>
              </div>
              <p style={{fontSize: '12px', color: '#888', marginTop: '10px'}}>
                💡 Tip: Get coordinates from Google Maps - Right-click on location → Click coordinates
              </p>
            </div>
          )}

          {(location || manualLocation) && (
            <div className="location-status success">
              <span className="icon">📍</span>
              <div>
                <p><strong>Your Location</strong></p>
                <p className="coordinates">
                  {(manualLocation || location).latitude.toFixed(4)}, {(manualLocation || location).longitude.toFixed(4)}
                </p>
                {manualLocation && (
                  <button 
                    onClick={() => {
                      setManualLocation(null);
                      requestLocation();
                    }}
                    style={{
                      marginTop: '5px',
                      fontSize: '12px',
                      padding: '5px 10px',
                      background: '#444',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Use GPS Instead
                  </button>
                )}
              </div>
            </div>
          )}

          {!location && !geoLoading && !geoError && (
            <button onClick={requestLocation} className="btn-get-location">
              📍 Enable Location
            </button>
          )}
        </div>

        {(location || manualLocation) && (
          <div className="radius-filter">
            <label>Search Radius:</label>
            <div className="radius-options">
              {[2, 5, 10, 15].map((r) => (
                <button
                  key={r}
                  className={`radius-btn ${radius === r ? 'active' : ''}`}
                  onClick={() => setRadius(r)}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Finding barber shops nearby...</p>
          </div>
        )}

        {!loading && (location || manualLocation) && (
          <div className="barbers-list">
            {barberShops.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>No Barber Shops Found</h3>
                <p>Try increasing the search radius or check back later.</p>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <h2>Found {barberShops.length} Barber Shop{barberShops.length !== 1 ? 's' : ''}</h2>
                  <p>Sorted by distance</p>
                </div>

                <div className="barbers-grid">
                  {barberShops.map((shop) => (
                    <div 
                      key={shop.id || shop._id || shop.shopId} 
                      className="barber-card"
                      onClick={() => handleSelectBarber(shop)}
                    >
                      <div className="shop-header">
                        <div className="shop-icon">✂️</div>
                        <div className="distance-badge">
                          {shop.distanceText || `${shop.distance} km away`}
                        </div>
                      </div>

                      <h3>{shop.shopName || shop.name}</h3>
                      
                      <div className="shop-info">
                        <div className="info-row">
                          <span className="icon">📍</span>
                          <span>
                            {shop.address?.street ? `${shop.address.street}, ${shop.address.city}` : shop.address || 'Address not available'}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="icon">📞</span>
                          <span>{shop.phone || shop.ownerPhone || 'N/A'}</span>
                        </div>

                        <div className="info-row">
                          <span className="icon">🕒</span>
                          <span>
                            {shop.openingTime || shop.operatingHours?.opening || '09:00'} - {shop.closingTime || shop.operatingHours?.closing || '20:00'}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="icon">👥</span>
                          <span>Queue: {shop.queueLength || 0} | Wait: {shop.waitTimeText || 'No wait'}</span>
                        </div>
                      </div>

                      <div className="services-tags">
                        {(shop.services || []).slice(0, 3).map((service, idx) => (
                          <span key={idx} className="service-tag">
                            {service.replace('-', ' ')}
                          </span>
                        ))}
                        {(shop.services || []).length > 3 && (
                          <span className="service-tag more">
                            +{shop.services.length - 3} more
                          </span>
                        )}
                      </div>

                      <button className="btn-select-shop">
                        Join Queue →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindBarbers;
