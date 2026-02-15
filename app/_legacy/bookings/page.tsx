"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type BookingRow = {
  id: string;
  service: string;
  scheduled_at: string;
  status: string;
  patient_name?: string | null;
  provider?: { id: string; name: string; role: string; photo_url?: string | null } | null;
  referred_provider?: { id: string; name: string; role: string } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch("/api/bookings", { headers });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load bookings.");
          return;
        }
        setBookings(data.bookings ?? []);
      } catch {
        setError("Failed to load bookings.");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(bookingId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCancellingId(bookingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) await loadBookings();
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">My bookings</h1>
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">My bookings</h1>
      {error && (
        <p className="text-red-600 mb-4" role="alert">{error}</p>
      )}
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          <p className="mb-4">You don’t have any bookings yet.</p>
          <Link href="/" className="text-red-500 font-medium hover:underline">
            Find care →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const date = new Date(b.scheduled_at).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            });
            const providerName = b.provider?.name ?? "Provider";
            return (
              <li key={b.id}>
                <div className="rounded-2xl border border-stone-200 bg-white p-5 hover:shadow-md transition-shadow flex justify-between items-start gap-4">
                  <Link href={`/booking/confirmed?id=${b.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{providerName}</p>
                    <p className="text-sm text-stone-600 capitalize mt-0.5">
                      {b.service.replace(/_/g, " ")} · {date}
                    </p>
                    <span
                      className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "completed"
                          ? "bg-stone-100 text-stone-700"
                          : b.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : b.status === "declined"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status === "declined" ? "Declined" : b.status}
                    </span>
                    {b.status === "declined" && b.referred_provider && (
                      <p className="text-xs text-stone-600 mt-1.5">
                        Suggested alternative:{" "}
                        <Link href={`/provider/${b.referred_provider.id}`} className="text-red-600 font-medium hover:underline">
                          {b.referred_provider.name}
                        </Link>
                      </p>
                    )}
                  </Link>
                  {b.status !== "cancelled" && b.status !== "completed" && b.status !== "declined" && (
                    <button
                      type="button"
                      onClick={(e) => handleCancel(b.id, e)}
                      disabled={cancellingId === b.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50 shrink-0"
                    >
                      {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/" className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">
        ← Back to find care
      </Link>
    </div>
  );
}
