import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/ui/Header";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function isValidEmail(value) {
    const trimmed = (value || "").trim();
    return trimmed.includes("@") && trimmed.includes(".") && trimmed.indexOf("@") < trimmed.lastIndexOf(".");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    setLoading(true);
    try {
      if (!supabase) {
        setError("Auth is not configured.");
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (err) {
        setError(err.message || "Login failed.");
        return;
      }
      navigate("/patient-search-and-booking");
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
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Patient log in</h1>
      <p className="text-stone-600 mb-6">Sign in to book care or manage your bookings.</p>
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
        Don&apos;t have an account? Patient sign up
      </button>
      <button
        type="button"
        onClick={() => navigate("/login/provider")}
        className="block w-full mt-3 text-sm text-stone-500 hover:text-stone-700"
      >
        I&apos;m a provider — log in here
      </button>
      <button
        type="button"
        onClick={() => { window.location.href = "/"; }}
        className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700"
      >
        Back
      </button>
    </div>
    </>
  );
}
