import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

/**
 * Home Component - Landing page with role selection
 */
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container-new">
      <div className="home-content-new">
        <header className="home-header-new">
          <h1 className="app-title">QueueCut</h1>
          <p className="tagline-new">Skip the wait, join the queue digitally</p>
          <p className="description">
            Connect with local barbers and manage your queue time efficiently. 
            No more standing in line!
          </p>
        </header>

        <div className="role-selection">
          {/* Customer Card */}
          <div className="role-card customer-role" onClick={() => navigate('/customer-auth')}>
            <div className="role-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2>I'm a Customer</h2>
            <p className="role-description">Find nearby barbers and join their queue remotely</p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Find barbers near you</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Join queue remotely</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Track your position</span>
              </div>
            </div>
          </div>

          {/* Barber Card */}
          <div className="role-card barber-role" onClick={() => navigate('/barber-auth')}>
            <div className="role-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>I'm a Barber</h2>
            <p className="role-description">Sign in to manage your digital queue</p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Manage your queue</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Serve customers efficiently</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">✓</span>
                <span>Real-time updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Notice for Barber Registration */}
        <div className="home-footer">
          <div className="notice-card">
            <div className="notice-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="notice-content">
              <h3>Want to register your barber shop?</h3>
              <p>
                New barber shops require manual verification for platform security. 
                Please email us at <a href="mailto:queuecut.barber.register@gmail.com" className="email-link">queuecut.barber.register@gmail.com</a> with your shop details to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
