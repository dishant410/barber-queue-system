import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import queueService from '../services/queueService';
import locationService from '../services/locationService';
import authService from '../services/authService';
import realtimeService from '../services/realtimeService';
import '../styles/NearbyBarbers.css';

/**
 * NearbyBarbers Component
 * Displays barbers within 2km radius of customer's location
 * Supports offline mode with cached data
 */
const NearbyBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [joiningQueue, setJoiningQueue] = useState({});
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    serviceType: 'haircut'
  });
  const [myQueueStatus, setMyQueueStatus] = useState(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);
  const [showManualLocationModal, setShowManualLocationModal] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      console.log('🟢 Back online - refreshing data...');
      if (userLocation) {
        fetchNearbyBarbers();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineMessage('You are offline. Showing cached data.');
      console.log('🔴 Offline mode activated');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userLocation]);

  // Check for cached location on mount (user-specific)
  // Location is persisted after first permission grant
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const cachedLocation = locationService.getCachedLocation(currentUser._id);
      if (cachedLocation) {
        console.log('📍 Using cached location for user:', currentUser._id);
        setUserLocation(cachedLocation);
        setLocationPermissionAsked(true);
      } else {
        console.log('🔍 No cached location found for this user, will ask for permission');
      }
    }
  }, []);

  // Fetch nearby barbers when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyBarbers();
    }
  }, [userLocation]);

  // Check user's current queue status on mount
  useEffect(() => {
    const checkMyQueueStatus = async () => {
      // First check local storage for immediate feedback
      const savedStatus = localStorage.getItem('queueStatus');
      if (savedStatus) {
        try {
          const parsedStatus = JSON.parse(savedStatus);
          setMyQueueStatus(parsedStatus);
        } catch (e) {
          console.error('Error parsing saved queue status', e);
          localStorage.removeItem('queueStatus');
        }
      }

      try {
        const response = await queueService.getMyQueueStatus();
        if (response.data) {
          setMyQueueStatus(response.data);
          // Update local storage with fresh data from server
          localStorage.setItem('queueStatus', JSON.stringify(response.data));
        } else {
          // If server says no queue, clear local
          // Only clear if we had something saved, to avoid unnecessary writes
          if (savedStatus) {
            setMyQueueStatus(null);
            localStorage.removeItem('queueStatus');
          }
        }
      } catch (err) {
        console.log('No active queue or error:', err);
        // If 401, maybe clear? But for now keep local persistence in case of network error
      }
    };

    const user = authService.getCurrentUser();
    if (user) {
      checkMyQueueStatus();
    }
  }, []);

  // Handle cancel queue
  const handleCancelQueue = async () => {
    if (!myQueueStatus) return;

    const confirmed = window.confirm('Are you sure you want to cancel your queue position?');
    if (!confirmed) return;

    setCancellingQueue(true);
    try {
      await queueService.cancelQueue(myQueueStatus._id);
      setMyQueueStatus(null);
      localStorage.removeItem('queueStatus');
      alert('Queue cancelled successfully');
      fetchNearbyBarbers(); // Refresh barber list
    } catch (err) {
      alert(err.message || 'Failed to cancel queue');
    } finally {
      setCancellingQueue(false);
    }
  };

  // Listen for shop status changes via Socket.io
  useEffect(() => {
    console.log('🔌 Setting up shop status listener');

    // Ensure connection
    realtimeService.connect();

    // Setup listener immediately (Socket.io handles buffering if not connected yet)
    realtimeService.onShopStatusChange((data) => {
      console.log('📢 Shop status changed - updating UI:', data);

      setBarbers(prevBarbers => {
        // Create a new array reference to trigger re-render
        const updated = prevBarbers.map(barber => {
          if (barber.shopId === data.shopId) {
            console.log(`🔄 Updating status for ${barber.shopName} to ${data.isOpen ? 'OPEN' : 'CLOSED'}`);
            return { ...barber, isOpen: data.isOpen };
          }
          return barber;
        });
        return updated;
      });
    });

    return () => {
      // Optional: Cleanup listener if needed, but keeping it active is usually fine for this use case
      // realtimeService.off('shop-status-changed');
    };
  }, []);

  // Get user's current location with caching support (user-specific)
  const getUserLocation = async () => {
    setLocationPermissionAsked(true);
    setLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?._id || null;

      const location = await locationService.getCurrentLocation(userId);

      console.log('📍 Your current location:', location);
      console.log('🔍 View on map: https://www.google.com/maps?q=' + location.latitude + ',' + location.longitude);

      if (location.isCached) {
        console.log('⚠️ Using cached location:', location);
      }

      if (userId) {
        console.log('💾 Location cached for user:', userId);
        
        // Send location to backend for storage (priority: coordinates captured on login/app open)
        try {
          await authService.updateCustomerLocation(location.latitude, location.longitude);
          console.log('✅ Customer location saved to database');
        } catch (err) {
          console.warn('⚠️ Failed to save location to backend:', err);
          // Don't block user flow if backend update fails
        }
      }

      setUserLocation(location);
      // We still update the cache when they genuinely select/fetch location, 
      // just don't auto-load it on next refresh.

      setLocationError(null);
    } catch (err) {
      console.error('Location error:', err);
      setLocationError(err.message);
      setLoading(false);
    }
  };

  // Handle manual location submission
  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates.\nLatitude: -90 to 90\nLongitude: -180 to 180');
      return;
    }

    const location = { latitude: lat, longitude: lng };
    setUserLocation(location);
    setShowManualLocationModal(false);
    setLocationPermissionAsked(true);
    console.log('📍 Manual location set:', location);
  };

  // Fetch nearby barbers from API with offline fallback
  const fetchNearbyBarbers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching nearby barbers for location:', userLocation);

      // Fetch barbers within 5 km radius (5000 meters as per requirements)
      const response = await locationService.getNearbyBarbers(
        userLocation.latitude,
        userLocation.longitude,
        5000 // 5km radius - coordinate-based search priority
      );

      console.log('📦 Backend response:', response);
      console.log('📊 Number of barbers received:', response.data?.length || 0);
      console.log('📍 Barbers data:', response.data);

      // Check if response is from cache (offline mode)
      if (response.isOffline || response.isCached) {
        setIsOffline(true);
        setOfflineMessage(response.offlineMessage || 'Showing cached data');
        setLastUpdated(locationService.getTimeSinceLastFetch());
      } else {
        setIsOffline(false);
        setOfflineMessage('');
        setLastUpdated('Just now');
      }

      setBarbers(response.data || []);
      console.log('✅ Barbers state updated, count:', response.data?.length || 0);
    } catch (err) {
      console.error('Error fetching barbers:', err);

      // Try to load cached data
      const cachedData = locationService.getCachedBarbers();
      if (cachedData && cachedData.data) {
        setBarbers(cachedData.data);
        setIsOffline(true);
        setOfflineMessage('Network error. Showing cached data.');
        setLastUpdated(locationService.getTimeSinceLastFetch());
      } else {
        setError(err.message || 'Failed to fetch nearby barbers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle joining a queue - check auth first, then open service selection modal
  const handleJoinQueue = (barber) => {
    // Check if user is authenticated
    const user = authService.getCurrentUser();
    if (!user) {
      // Redirect to login if not authenticated
      alert('Please login to join the queue');
      navigate('/customer-auth');
      return;
    }

    setSelectedBarber(barber);
    setShowServiceModal(true);
  };

  // Close service modal
  const closeServiceModal = () => {
    setShowServiceModal(false);
    setSelectedBarber(null);
    setCustomerInfo({
      serviceType: 'haircut'
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit queue join with service selection
  const submitJoinQueue = async () => {
    // Validation
    if (!customerInfo.serviceType) {
      alert('Please select a service type');
      return;
    }

    try {
      setJoiningQueue({ ...joiningQueue, [selectedBarber.shopId]: true });

      const response = await queueService.joinQueue({
        serviceType: customerInfo.serviceType,
        shopId: selectedBarber.shopId
      });

      const user = authService.getCurrentUser();
      alert(`Successfully joined ${selectedBarber.shopName}'s queue!\n\nToken: ${response.data.tokenNumber}\nPosition: ${response.data.queuePosition}\nService: ${customerInfo.serviceType}\nEstimated Wait: ${response.data.estimatedWaitTime} min`);

      // Update local state immediately
      const newQueueStatus = {
        _id: response.data.customerId,
        tokenNumber: response.data.tokenNumber,
        queuePosition: response.data.queuePosition,
        estimatedWaitTime: response.data.estimatedWaitTime,
        serviceType: customerInfo.serviceType,
        status: 'waiting',
        shopId: selectedBarber.shopId
      };

      setMyQueueStatus(newQueueStatus);
      localStorage.setItem('queueStatus', JSON.stringify(newQueueStatus));

      closeServiceModal();
      // Refresh barbers list
      fetchNearbyBarbers();
    } catch (err) {
      alert(err.message || 'Failed to join queue');
      if (err.message?.includes('login')) {
        navigate('/customer-auth');
      }
    } finally {
      setJoiningQueue({ ...joiningQueue, [selectedBarber?.shopId]: false });
    }
  };

  // Open directions in Google Maps
  const openDirections = (barber) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${barber.coordinates.latitude},${barber.coordinates.longitude}`;
    window.open(url, '_blank');
  };

  // Render star rating
  const renderRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star full">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.customerLogout();
      navigate('/customer-auth');
    } catch (err) {
      console.error('Logout error:', err);
      // Still navigate even if API call fails
      navigate('/customer-auth');
    }
  };

  // Location permission modal (shown as popup overlay)
  const renderLocationPermissionModal = () => {
    if (locationPermissionAsked || userLocation) return null;

    return (
      <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="permission-modal" onClick={(e) => e.stopPropagation()}>
          <div className="permission-icon">📍</div>
          <h2>Location Access Needed</h2>
          <p className="permission-message">
            To show you nearby barber shops within 5km, we need access to your location.
          </p>
          <div className="permission-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Find barbers near you</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>See accurate distances</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Get directions easily</span>
            </div>
          </div>
          <button onClick={getUserLocation} className="btn-allow-location">
            Allow Location Access
          </button>
          <p className="privacy-note">
            🔒 Your location is only used to find nearby shops and is not stored on our servers
          </p>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="nearby-barbers-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Finding nearby barbers...</p>
        </div>
      </div>
    );
  }

  // Location error state
  if (locationError) {
    return (
      <div className="nearby-barbers-container">
        <div className="error-state">
          <div className="error-icon">📍</div>
          <h2>Location Access Issue</h2>
          <p>{locationError}</p>

          <div className="error-solutions">
            <h3>Try these solutions:</h3>
            <ul>
              <li>Make sure location services are enabled on your device</li>
              <li>Check if your browser has location permission</li>
              <li>Try using a different browser (Chrome or Firefox recommended)</li>
              <li>Move to an area with better GPS signal</li>
            </ul>
          </div>

          <button onClick={getUserLocation} className="retry-btn">
            🔄 Try Again
          </button>

          <p className="help-text">
            Still having issues? Contact us at <a href="mailto:queuecut.barber.register@gmail.com">queuecut.barber.register@gmail.com</a>
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="nearby-barbers-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchNearbyBarbers} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-barbers-container">
      {/* Location Permission Modal */}
      {renderLocationPermissionModal()}

      {/* Manual Location Modal */}
      {showManualLocationModal && (
        <div className="modal-overlay" onClick={() => setShowManualLocationModal(false)}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setShowManualLocationModal(false)}>✕</button>

            <h2>📍 Enter Your Location</h2>
            <p className="modal-subtitle">Enter your coordinates manually</p>

            <div className="modal-form">
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 23.0225"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 72.5714"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>
                💡 Tip: Open Google Maps, right-click your location, and copy coordinates
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowManualLocationModal(false)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleManualLocationSubmit}>
                  Set Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Selection Modal */}
      {showServiceModal && selectedBarber && (
        <div className="modal-overlay" onClick={closeServiceModal}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeServiceModal}>✕</button>

            <h2>Join Queue - {selectedBarber.shopName}</h2>
            <p className="modal-subtitle">Select the service you need</p>

            <div className="modal-form">
              <div className="form-group">
                <label>Select Service *</label>
                <div className="service-options">
                  <label className={`service-option ${customerInfo.serviceType === 'haircut' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="haircut"
                      checked={customerInfo.serviceType === 'haircut'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">✂️</div>
                      <div className="service-name">Haircut</div>
                      <div className="service-time">~20 min</div>
                    </div>
                  </label>

                  <label className={`service-option ${customerInfo.serviceType === 'shave' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="shave"
                      checked={customerInfo.serviceType === 'shave'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">🪒</div>
                      <div className="service-name">Shave</div>
                      <div className="service-time">~15 min</div>
                    </div>
                  </label>

                  <label className={`service-option ${customerInfo.serviceType === 'haircut-shave' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="haircut-shave"
                      checked={customerInfo.serviceType === 'haircut-shave'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">💈</div>
                      <div className="service-name">Haircut + Shave</div>
                      <div className="service-time">~35 min</div>
                    </div>
                  </label>

                  <label className={`service-option ${customerInfo.serviceType === 'styling' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="styling"
                      checked={customerInfo.serviceType === 'styling'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">💇</div>
                      <div className="service-name">Hair Styling</div>
                      <div className="service-time">~30 min</div>
                    </div>
                  </label>

                  <label className={`service-option ${customerInfo.serviceType === 'beard-trim' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="beard-trim"
                      checked={customerInfo.serviceType === 'beard-trim'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">🧔</div>
                      <div className="service-name">Beard Trim</div>
                      <div className="service-time">~10 min</div>
                    </div>
                  </label>

                  <label className={`service-option ${customerInfo.serviceType === 'other' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="serviceType"
                      value="other"
                      checked={customerInfo.serviceType === 'other'}
                      onChange={handleInputChange}
                    />
                    <div className="service-card">
                      <div className="service-icon">✨</div>
                      <div className="service-name">Other</div>
                      <div className="service-time">Varies</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="queue-summary">
                <div className="summary-item">
                  <span>Current Queue:</span>
                  <strong>{selectedBarber.queueLength} people</strong>
                </div>
                <div className="summary-item">
                  <span>Estimated Wait:</span>
                  <strong>{selectedBarber.waitTimeText}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={closeServiceModal}>
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={submitJoinQueue}
                  disabled={joiningQueue[selectedBarber.shopId]}
                >
                  {joiningQueue[selectedBarber.shopId] ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="nearby-header">
        <div className="header-content">
          <div>
            <h1>Nearby Barbers</h1>
            <p className="subtitle">
              {barbers.length} barber{barbers.length !== 1 ? 's' : ''} found within 5km • Queue lengths update every 30 seconds
            </p>
            {userLocation && (
              <p className="location-info">
                📍 Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </p>
            )}
          </div>
          {authService.getCurrentUser() && (
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </header>

      {/* User's Active Queue Status Card */}
      {myQueueStatus && (
        <div className="my-queue-card">
          <div className="queue-card-header">
            <h3>🎫 Your Queue Status</h3>
            <span className={`queue-status-badge ${myQueueStatus.status}`}>
              {myQueueStatus.status === 'waiting' ? '⏳ Waiting' : '✂️ In Service'}
            </span>
          </div>
          <div className="queue-card-body">
            <div className="queue-detail">
              <span className="label">Token:</span>
              <span className="value">#{myQueueStatus.tokenNumber}</span>
            </div>
            <div className="queue-detail">
              <span className="label">Position:</span>
              <span className="value">{myQueueStatus.queuePosition}</span>
            </div>
            <div className="queue-detail">
              <span className="label">Service:</span>
              <span className="value">{myQueueStatus.serviceType?.replace('-', ' ')}</span>
            </div>
            <div className="queue-detail">
              <span className="label">Est. Wait:</span>
              <span className="value">{myQueueStatus.estimatedWaitTime || (myQueueStatus.queuePosition * 15)} min</span>
            </div>
          </div>
          {myQueueStatus.status === 'waiting' && (
            <button
              className="btn-cancel-queue"
              onClick={handleCancelQueue}
              disabled={cancellingQueue}
            >
              {cancellingQueue ? 'Cancelling...' : '❌ Cancel Queue'}
            </button>
          )}
        </div>
      )}

      {barbers.length === 0 ? (
        <div className="no-barbers">
          <div className="no-barbers-icon">💈</div>
          <h2>No Barbers Nearby</h2>
          <p>No barber shops found within 5km of your location</p>
          <button onClick={fetchNearbyBarbers} className="refresh-btn">
            Refresh
          </button>
        </div>
      ) : (
        <div className="barbers-list">
          {barbers.map((barber) => (
            <div key={barber.shopId} className="barber-card">
              <div className="barber-header">
                <div className="barber-info">
                  <h3 className="barber-name">{barber.shopName}</h3>
                  <div className="rating">
                    {renderRating(barber.rating)}
                    <span className="rating-value">{barber.rating.toFixed(1)}</span>
                  </div>
                  <p className="distance">{barber.distanceText} away</p>
                </div>
                {barber.isOpen && barber.status === 'active' ? (
                  <span className="status-badge open">Open</span>
                ) : (
                  <span className="status-badge closed">Closed</span>
                )}
              </div>

              <div className="barber-details">
                <div className="queue-info">
                  <div className="queue-stat">
                    <span className="label">Queue:</span>
                    <span className="value">{barber.queueLength}</span>
                  </div>
                  <div className="queue-stat">
                    <span className="label">Waiting:</span>
                    <span className="value">{barber.waitTimeText}</span>
                  </div>
                </div>

                {barber.address && (
                  <p className="address">📍 {barber.address}</p>
                )}

                <div className="hours">
                  ⏰ {barber.openingTime} - {barber.closingTime}
                </div>
              </div>

              <div className="barber-actions">
                <button
                  className="btn-join"
                  onClick={() => handleJoinQueue(barber)}
                  disabled={!barber.isOpen || barber.status !== 'active' || joiningQueue[barber.shopId]}
                >
                  {joiningQueue[barber.shopId] ? 'Joining...' : '+ Join Queue'}
                </button>
                <button
                  className="btn-directions"
                  onClick={() => openDirections(barber)}
                >
                  📍 Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyBarbers;
