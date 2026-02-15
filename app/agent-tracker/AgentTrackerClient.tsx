"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entry = {
  id: string;
  at: string;
  type: "text" | "audio";
  status: "success" | "error" | "unavailable";
  sessionId?: string;
  error?: string;
};

export default function AgentTrackerClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/intake/activity");
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
        }
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
    const interval = setInterval(fetchActivity, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">
            AI intake agent tracker
          </h1>
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Back to home
          </Link>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Recent requests through the intake pipeline (refreshes every 3s). For testing only.
        </p>

        {loading && entries.length === 0 ? (
          <p className="text-stone-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-stone-500 rounded-xl border border-stone-200 bg-white p-6">
            No activity yet. Submit text or audio intake from the app to see entries here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-stone-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-stone-500">
                    {new Date(entry.at).toLocaleString()}
                  </span>
                  <span
                    className={
                      entry.status === "success"
                        ? "text-emerald-600"
                        : entry.status === "unavailable"
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  >
                    {entry.type} · {entry.status}
                  </span>
                  {entry.sessionId && (
                    <span className="text-stone-400 truncate max-w-[180px]">
                      {entry.sessionId}
                    </span>
                  )}
                </div>
                {entry.error && (
                  <p className="mt-2 text-stone-600 truncate" title={entry.error}>
                    {entry.error}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
