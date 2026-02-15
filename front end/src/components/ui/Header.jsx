import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState('patient');

  const isPatientView = location?.pathname === '/patient-search-and-booking';
  const isProviderView = location?.pathname === '/provider-dashboard-and-management';

  const handleRoleToggle = () => {
    if (isPatientView) {
      setCurrentRole('provider');
      navigate('/provider-dashboard-and-management');
    } else {
      setCurrentRole('patient');
      navigate('/patient-search-and-booking');
    }
  };

  const handleLogoClick = () => {
    navigate('/patient-search-and-booking');
  };

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-brand" onClick={handleLogoClick} role="button" tabIndex={0} onKeyPress={(e) => e?.key === 'Enter' && handleLogoClick()}>
          <div className="header-logo">
            <img 
              src="/assets/images/CareBnb_Logo__for_submission_-1771103577321.png" 
              alt="CareBnb Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <nav className="header-nav">
          <div 
            className="role-toggle" 
            onClick={handleRoleToggle}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e?.key === 'Enter' && handleRoleToggle()}
            aria-label={isPatientView ? 'Switch to Provider View' : 'Switch to Patient View'}
          >
            <Icon 
              name={isPatientView ? 'Stethoscope' : 'User'} 
              size={20} 
              className="role-toggle-icon"
              strokeWidth={2}
            />
            <span className="role-toggle-text">
              {isPatientView ? 'Switch to Provider' : 'Switch to Patient'}
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;