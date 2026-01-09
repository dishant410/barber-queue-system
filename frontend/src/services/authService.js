import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

// Set auth token in axios headers
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize auth token from localStorage
const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Customer Authentication
const customerSignup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/customer/signup`, userData, {
      withCredentials: true
    });
    if (response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setAuthToken(response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Signup failed' };
  }
};

const customerLogin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/customer/login`, credentials, {
      withCredentials: true
    });
    if (response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setAuthToken(response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

const customerLogout = async () => {
  try {
    await axios.post(`${API_URL}/customer/logout`, {}, {
      withCredentials: true
    });
    localStorage.removeItem('user');
    setAuthToken(null);
  } catch (error) {
    // Still clear local data even if API call fails
    localStorage.removeItem('user');
    setAuthToken(null);
    throw error.response?.data || { message: 'Logout failed' };
  }
};

// Barber Authentication
const barberSignup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/barber/signup`, userData, {
      withCredentials: true
    });
    if (response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setAuthToken(response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Signup failed' };
  }
};

const barberLogin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/barber/login`, credentials, {
      withCredentials: true
    });
    if (response.data.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
      setAuthToken(response.data.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

const barberLogout = async () => {
  try {
    await axios.post(`${API_URL}/barber/logout`, {}, {
      withCredentials: true
    });
    localStorage.removeItem('user');
    setAuthToken(null);
  } catch (error) {
    // Still clear local data even if API call fails
    localStorage.removeItem('user');
    setAuthToken(null);
    throw error.response?.data || { message: 'Logout failed' };
  }
};

// Logout (generic - clears local storage)
const logout = () => {
  localStorage.removeItem('user');
  setAuthToken(null);
};

// Get current user
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get user role
const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

// Update customer location (send coordinates to backend on login/app open)
const updateCustomerLocation = async (latitude, longitude, address = null) => {
  try {
    const response = await axios.patch(`${API_URL}/customer/location`, {
      latitude,
      longitude,
      address
    }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update customer location:', error);
    throw error.response?.data || { message: 'Location update failed' };
  }
};

const authService = {
  customerSignup,
  customerLogin,
  customerLogout,
  barberSignup,
  barberLogin,
  barberLogout,
  logout,
  getCurrentUser,
  isAuthenticated,
  getUserRole,
  initializeAuth,
  setAuthToken,
  updateCustomerLocation
};

export default authService;
