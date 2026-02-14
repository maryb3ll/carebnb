"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Sign up</h1>
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
            minLength={6}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <p className="mt-1 text-xs text-stone-500">At least 6 characters</p>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Signing up…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="text-red-500 font-medium hover:underline">
          Log in
        </Link>
      </p>
      <Link href="/" className="inline-block mt-4 text-sm text-stone-500 hover:text-stone-700">
        ← Back to home
      </Link>
    </div>
  );
}
