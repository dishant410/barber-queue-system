import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

/**
 * Barber Registration Service
 */

// Barber Signup
const barberSignup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/barber/signup`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Signup failed' };
  }
};

const authService = {
  barberSignup
};

export default authService;
