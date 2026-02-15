import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [providerId, setProviderId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null); // 'patient' or 'provider'
  const [loading, setLoading] = useState(true);

  // Fetch user role information
  const fetchUserRoles = async () => {
    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch('/api/me', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext - User roles from API:', data);
        setUser(data.user);
        setPatientId(data.patientId);
        setProviderId(data.providerId);

        // Determine default role
        if (data.providerId && data.patientId) {
          // Has both - default to provider, but allow switching
          const role = localStorage.getItem('preferredRole') || 'provider';
          console.log('User has both roles - setting current role to:', role);
          setCurrentRole(role);
        } else if (data.providerId) {
          // Provider only
          console.log('User has provider role only');
          setCurrentRole('provider');
        } else if (data.patientId) {
          // Patient only
          console.log('User has patient role only');
          setCurrentRole('patient');
        } else {
          console.log('User has no roles');
          setCurrentRole(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        fetchUserRoles();
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Switch between roles (only if user has both)
  const switchRole = (role) => {
    if (role === 'provider' && !providerId) {
      console.error('User does not have provider access');
      return;
    }
    if (role === 'patient' && !patientId) {
      console.error('User does not have patient access');
      return;
    }
    setCurrentRole(role);
    localStorage.setItem('preferredRole', role);
  };

  const hasRole = (role) => {
    if (role === 'provider') return !!providerId;
    if (role === 'patient') return !!patientId;
    return false;
  };

  const hasBothRoles = () => {
    return !!providerId && !!patientId;
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setPatientId(null);
    setProviderId(null);
    setCurrentRole(null);
    localStorage.removeItem('preferredRole');
  };

  const value = {
    user,
    patientId,
    providerId,
    currentRole,
    loading,
    hasRole,
    hasBothRoles,
    switchRole,
    signOut,
    refreshRoles: fetchUserRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
