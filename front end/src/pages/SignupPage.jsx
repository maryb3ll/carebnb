import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/ui/Header";

export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  function isValidEmail(value) {
    const trimmed = (value || "").trim();
    return trimmed.includes("@") && trimmed.includes(".") && trimmed.indexOf("@") < trimmed.lastIndexOf(".");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
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
      const { error: err } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: fullName.trim() || undefined },
        },
      });
      if (err) {
        setError(err.message || "Sign up failed.");
        return;
      }
      setMessage("Check your email to confirm your account.");
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
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Sign up</h1>
      <p className="text-stone-600 mb-6">Create your CareBnB account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-full-name" className="block text-sm font-medium text-stone-700 mb-1">
            Full name
          </label>
          <input
            id="signup-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="e.g. Jane Smith"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-stone-700 mb-1">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-primary" role="alert">{error}</p>
        )}
        {message && (
          <p className="text-sm text-emerald-600" role="status">{message}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign up"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="block w-full mt-4 text-sm text-stone-500 hover:text-stone-700"
      >
        Already have an account? Log in
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
