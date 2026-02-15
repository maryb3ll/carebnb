"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session?.user);
      setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don’t match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/login?reset=1");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto">
        <p className="text-stone-600">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">Invalid or expired link</h1>
        <p className="text-stone-600 mb-4">
          This reset link may have expired or already been used. Request a new one below.
        </p>
        <Link href="/forgot-password" className="text-red-500 font-medium hover:underline">
          Request new reset link →
        </Link>
        <Link href="/login" className="block mt-4 text-sm text-stone-500 hover:text-stone-700">
          ← Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Set new password</h1>
      <p className="text-stone-600 mb-6">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <p className="mt-1 text-xs text-stone-500">At least 6 characters</p>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-stone-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
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
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <Link href="/login" className="inline-block mt-4 text-sm text-stone-500 hover:text-stone-700">
        ← Back to log in
      </Link>
    </div>
  );
}
