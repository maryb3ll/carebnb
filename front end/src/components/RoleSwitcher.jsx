import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleSwitcher = () => {
  const { currentRole, hasBothRoles, switchRole } = useAuth();
  const navigate = useNavigate();

  // Only show if user has both roles
  if (!hasBothRoles()) {
    return null;
  }

  const handleRoleSwitch = () => {
    const newRole = currentRole === 'patient' ? 'provider' : 'patient';
    switchRole(newRole);

    // Navigate to appropriate homepage
    if (newRole === 'provider') {
      navigate('/provider-dashboard-and-management');
    } else {
      navigate('/patient-search-and-booking');
    }
  };

  return (
    <button
      onClick={handleRoleSwitch}
      className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-base"
      title={`Switch to ${currentRole === 'patient' ? 'Provider' : 'Patient'} View`}
    >
      {currentRole === 'patient' ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white border-2 border-primary"></span>
          Switch to Provider
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Switch to Patient
        </span>
      )}
    </button>
  );
};

export default RoleSwitcher;
