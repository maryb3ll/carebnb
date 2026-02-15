import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/ui/Header";

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = async () => {
    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
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

  useEffect(() => { loadBookings(); }, []);

  async function handleCancel(bookingId, e) {
    e.preventDefault();
    e.stopPropagation();
    setCancellingId(bookingId);
    try {
      const headers = { "Content-Type": "application/json" };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      }
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
      <>
        <Header />
        <div className="max-w-2xl mx-auto main-content-pt px-4 w-full min-w-0">
        <h1 className="text-2xl font-semibold text-stone-900 mb-6">My bookings</h1>
        <p className="text-stone-500">Loading…</p>
      </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto main-content-pt px-4 w-full min-w-0">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">My bookings</h1>
      {error && <p className="text-primary mb-4" role="alert">{error}</p>}
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          <p className="mb-4">You have no bookings yet.</p>
          <button type="button" onClick={() => navigate("/patient-search-and-booking")} className="text-primary font-medium hover:underline">
            Find care
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const date = new Date(b.scheduled_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
            const providerName = b.provider?.name ?? "Provider";
            return (
              <li key={b.id}>
                <div className="rounded-2xl border border-stone-200 bg-white p-5 flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{providerName}</p>
                    <p className="text-sm text-stone-600 capitalize mt-0.5">{b.service.replace(/_/g, " ")} · {date}</p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : b.status === "completed" ? "bg-stone-100 text-stone-700" : b.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                      {b.status === "declined" ? "Declined" : b.status}
                    </span>
                    {b.status === "declined" && b.referred_provider && (
                      <p className="text-xs text-stone-600 mt-1.5">Suggested: {b.referred_provider.name}</p>
                    )}
                  </div>
                  {b.status !== "cancelled" && b.status !== "completed" && b.status !== "declined" && (
                    <button type="button" onClick={(e) => handleCancel(b.id, e)} disabled={cancellingId === b.id} className="text-sm text-primary hover:underline disabled:opacity-50 shrink-0">
                      {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={() => navigate("/patient-search-and-booking")} className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">Back to find care</button>
    </div>
    </>
  );
}
