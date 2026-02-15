import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * Renders children only when the user is logged in AND is a provider.
 * Otherwise: no user → /login; user but not provider → /patient-search-and-booking.
 */
export default function ProviderOnlyRoute({ children }) {
  const [user, setUser] = useState(null);
  const [providerId, setProviderId] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${session.access_token}` } })
          .then((res) => res.json())
          .then((data) => setProviderId(data.providerId ?? null))
          .catch(() => setProviderId(null))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setProviderId(undefined);
      if (session?.access_token) {
        fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${session.access_token}` } })
          .then((res) => res.json())
          .then((data) => setProviderId(data.providerId ?? null))
          .catch(() => setProviderId(null));
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  if (loading || providerId === undefined) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login/provider" replace />;
  if (!providerId) return <Navigate to="/patient-search-and-booking" replace />;

  return children;
}
