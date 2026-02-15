import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import HeaderAuth from '../HeaderAuth';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState('patient');

  const isPatientView = location?.pathname === '/' || location?.pathname === '/bookings' || location?.pathname === '/request-care' || (location?.pathname?.startsWith && location.pathname.startsWith('/patient-search-and-booking'));
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
    window.location.href = '/';
  };

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-brand" onClick={handleLogoClick} role="button" tabIndex={0} onKeyPress={(e) => e?.key === 'Enter' && handleLogoClick()}>
          <div className="header-logo">
            <img
              src={`${import.meta.env.BASE_URL}assets/images/CareBnb_Logo__for_submission_-1771103577321.png`}
              alt="CareBnB Logo"
              style={{ height: 'var(--header-logo-height)', width: 'auto', maxHeight: '120px', objectFit: 'contain', objectPosition: 'left' }}
            />
          </div>
        </div>

        {isPatientView && (
          <div className="flex-1 flex justify-center min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">Patient page</span>
          </div>
        )}
        {isProviderView && (
          <div className="flex-1 flex justify-center min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">Provider page</span>
          </div>
        )}

        <nav className="header-nav shrink-0">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            My bookings
          </button>
          <button
            type="button"
            onClick={() => navigate('/request-care')}
            className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Request care
          </button>
          <div
            className="role-toggle inline-flex"
            onClick={handleRoleToggle}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e?.key === 'Enter' && handleRoleToggle()}
            aria-label={isPatientView ? 'Switch to Provider View' : 'Switch to Patient View'}
          >
            <Icon name={isPatientView ? 'Stethoscope' : 'User'} size={16} className="role-toggle-icon" strokeWidth={2} />
            <span className="role-toggle-text">{isPatientView ? 'Switch to provider' : 'Switch to Patient'}</span>
          </div>
          <div className="inline-flex items-center pl-2 ml-2 border-l border-stone-100">
            <HeaderAuth />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;