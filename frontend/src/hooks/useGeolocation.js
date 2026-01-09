import { useState, useEffect, useCallback } from 'react';

/**
 * Custom React Hook for Geolocation
 * Manages browser geolocation API with real-time tracking
 * 
 * @param {Object} options - Geolocation options
 * @param {Boolean} watch - Enable continuous location tracking
 * @returns {Object} - { location, error, loading, requestLocation }
 */
const useGeolocation = (options = {}, watch = false) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);

  /**
   * Success callback for geolocation
   */
  const handleSuccess = useCallback((position) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    });
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Error callback for geolocation
   */
  const handleError = useCallback((err) => {
    let errorMessage = 'Failed to get location';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
      default:
        errorMessage = 'An unknown error occurred while getting location.';
    }

    setError(errorMessage);
    setLoading(false);
  }, []);

  /**
   * Request user's current location
   */
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    const geoOptions = {
      enableHighAccuracy: false, // Changed to false for faster response
      timeout: 30000, // Increased to 30 seconds
      maximumAge: 60000, // Allow cached location up to 1 minute old
      ...options
    };

    if (watch) {
      // Watch position for continuous updates
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
      setWatchId(id);
    } else {
      // Get current position once
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }
  }, [watch, handleSuccess, handleError]);

  /**
   * Clean up watch position on unmount
   */
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  /**
   * Auto-request location on mount if watch is enabled
   */
  useEffect(() => {
    if (watch) {
      requestLocation();
    }
  }, []);

  return {
    location,
    error,
    loading,
    requestLocation
  };
};

export default useGeolocation;
