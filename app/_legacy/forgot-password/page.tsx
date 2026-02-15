"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">Check your email</h1>
        <p className="text-stone-600 mb-6">
          We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
        </p>
        <Link href="/login" className="text-red-500 font-medium hover:underline">
          ← Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Forgot password?</h1>
      <p className="text-stone-600 mb-6">
        Enter your email and we’ll send you a link to reset your password.
      </p>
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
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <Link href="/login" className="inline-block mt-4 text-sm text-stone-500 hover:text-stone-700">
        ← Back to log in
      </Link>
    </div>
  );
}
