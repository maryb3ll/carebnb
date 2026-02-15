import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Header from "../components/ui/Header";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!supabase) {
        setError("Auth is not configured.");
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message || "Login failed.");
        return;
      }

      // Refresh user roles to determine where to redirect
      await refreshRoles();

      // Fetch user's roles to determine redirect
      const headers = {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/me', { headers });
      if (response.ok) {
        const data = await response.json();

        // Redirect based on roles
        if (data.providerId && data.patientId) {
          // Has both - default to provider (as per requirements)
          navigate("/provider-dashboard-and-management");
        } else if (data.providerId) {
          // Provider only
          navigate("/provider-dashboard-and-management");
        } else if (data.patientId) {
          // Patient only
          navigate("/patient-search-and-booking");
        } else {
          // No role assigned
          setError("Your account doesn't have any role assigned. Please contact support.");
        }
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="max-w-sm mx-auto main-content-pt px-4 w-full min-w-0">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Log in</h1>
      <p className="text-stone-600 mb-6">Sign in to your CareBnB account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-primary" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => navigate("/signup")}
        className="block w-full mt-4 text-sm text-stone-500 hover:text-stone-700"
      >
        Don&apos;t have an account? Sign up
      </button>
      <button
        type="button"
        onClick={() => navigate("/patient-search-and-booking")}
        className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700"
      >
        Back
      </button>
    </div>
    </>
  );
}
