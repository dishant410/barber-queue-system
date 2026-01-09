import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home.js';
import CustomerAuth from './components/CustomerAuth.js';
import BarberAuth from './components/BarberAuth.js';
import NearbyBarbers from './components/NearbyBarbers.js';
import FindBarbers from './components/FindBarbers.js';
import CustomerJoin from './components/CustomerJoin.js';
import CustomerStatus from './components/CustomerStatus.js';
import BarberDashboard from './components/BarberDashboard.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import authService from './services/authService.js';
import './styles/App.css';

/**
 * Main App Component
 * Handles routing for the entire application
 */
function App() {
  // Initialize authentication on app load
  useEffect(() => {
    authService.initializeAuth();
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer-auth" element={<CustomerAuth />} />
          <Route path="/barber-auth" element={<BarberAuth />} />
          
          {/* Protected Customer Routes */}
          <Route 
            path="/nearby-barbers" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NearbyBarbers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/find-barbers" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <FindBarbers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/join" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerJoin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/status" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerStatus />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Barber Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['barber']}>
                <BarberDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
