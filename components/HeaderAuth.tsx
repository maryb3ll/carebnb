"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function HeaderAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <span className="text-sm text-stone-400">…</span>
    );
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
      <Link href="/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
        Log in
      </Link>
      <Link
        href="/signup"
        className="text-sm font-medium text-white bg-primary px-3 py-1.5 rounded-lg hover:opacity-90"
      >
        Sign up
      </Link>
    </div>
  );
}
