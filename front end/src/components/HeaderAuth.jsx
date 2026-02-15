import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function HeaderAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    navigate("/patient-search-and-booking");
  }

  if (loading) {
    return <span className="text-sm text-stone-400">…</span>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-stone-600 truncate max-w-[140px]" title={user.email}>
          {user.email}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="text-sm font-medium text-stone-700 hover:text-stone-900"
      >
        Log in
      </button>
      <button
        type="button"
        onClick={() => navigate("/signup")}
        className="text-sm font-medium text-white bg-primary px-3 py-1.5 rounded-lg hover:opacity-90"
      >
        Sign up
      </button>
    </div>
  );
}
