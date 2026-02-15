import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import HeaderAuth from '../HeaderAuth';
import { supabase } from '../../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [me, setMe] = useState(null); // { providerId, patientId } from /api/me

  const isProvider = !!me?.providerId;
  const isProviderView = location?.pathname === '/provider-dashboard-and-management';
  const isPatientView = !isProviderView;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) fetchMe(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMe(null);
      if (session?.access_token) fetchMe(session.access_token);
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function fetchMe(accessToken) {
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      setMe({ providerId: data.providerId ?? null, patientId: data.patientId ?? null });
    } catch {
      setMe({ providerId: null, patientId: null });
    }
  }

  const handleLogoClick = () => {
    if (!user) {
      window.location.href = '/';
      return;
    }
    if (isProvider) {
      navigate('/provider-dashboard-and-management');
    } else {
      navigate('/patient-search-and-booking');
    }
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

        {user && (
          <div className="flex-1 flex justify-center min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
              {isProvider ? 'Provider' : 'Patient'}
            </span>
          </div>
        )}

        <nav className="header-nav shrink-0">
          <button
            type="button"
            onClick={handleLogoClick}
            className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            Home
          </button>
          {isProvider ? (
            <button
              type="button"
              onClick={() => navigate('/provider-dashboard-and-management')}
              className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Provider dashboard
            </button>
          ) : (
            <>
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
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-2.5 py-1.5 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                My profile
              </button>
            </>
          )}
          <div className="inline-flex items-center pl-2 ml-2 border-l border-stone-100">
            <HeaderAuth />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;