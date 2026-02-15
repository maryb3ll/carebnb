import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/ui/Header";
import { useAuth } from "../context/AuthContext";

export default function BookingsPage() {
  const navigate = useNavigate();
  const { currentRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState(null);

  const isProvider = currentRole === 'provider';

  const loadBookings = async () => {
    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      }
      // Fetch bookings based on role
      const url = isProvider ? "/api/bookings?for=provider" : "/api/bookings";
      console.log('BookingsPage - Fetching from:', url, 'isProvider:', isProvider);
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load bookings.");
        return;
      }
      // Show all bookings with their status
      console.log('BookingsPage - Received bookings:', data.bookings);
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
      if (res.ok) {
        // Update booking status to cancelled and refresh the list
        await loadBookings();
      }
    } finally {
      setCancellingId(null);
    }
  }

  async function handleDelete(bookingId, e) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(bookingId);
    try {
      const headers = {};
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        // Remove booking from the list
        await loadBookings();
      }
    } finally {
      setDeletingId(null);
    }
  }

  // Format decline reason for display (convert snake_case to Title Case)
  const formatDeclineReason = (reason) => {
    if (!reason) return "No reason provided";

    // If it's already a formatted sentence (contains spaces), return as-is
    if (reason.includes(' ')) return reason;

    // Convert snake_case to Title Case
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  function handleViewDeclineReason(declineReason, e) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDeclineReason(declineReason);
    setShowDeclineReason(true);
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
          {!isProvider && (
            <button type="button" onClick={() => navigate("/patient-search-and-booking")} className="text-primary font-medium hover:underline">
              Find care
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const date = new Date(b.scheduled_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
            const displayName = isProvider
              ? (b.patient_name || "Patient")
              : (b.provider?.name ?? "Provider");
            const displayPhone = isProvider ? b.patient_phone : null;
            return (
              <li key={b.id}>
                <div className={`rounded-2xl border border-stone-200 bg-white p-5 flex justify-between items-start gap-4 ${!isProvider && b.status === "declined" && b.decline_reason ? "cursor-pointer hover:bg-stone-50 transition-colors" : ""}`} onClick={!isProvider && b.status === "declined" && b.decline_reason ? (e) => handleViewDeclineReason(b.decline_reason, e) : undefined}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900">{displayName}</p>
                    {displayPhone && (
                      <p className="text-xs text-stone-500 mt-0.5">{displayPhone}</p>
                    )}
                    <p className="text-sm text-stone-600 capitalize mt-0.5">{b.service.replace(/_/g, " ")} · {date}</p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                      b.status === "pending" ? "bg-amber-100 text-amber-800" :
                      b.status === "declined" ? "bg-red-100 text-red-800" :
                      b.status === "cancelled" ? "bg-stone-200 text-stone-700" :
                      b.status === "completed" ? "bg-blue-100 text-blue-800" :
                      "bg-stone-100 text-stone-700"
                    }`}>
                      {b.status === "confirmed" ? "Accepted" :
                       b.status === "declined" ? "Denied" :
                       b.status === "pending" ? "Pending" :
                       b.status === "cancelled" ? "Cancelled" :
                       b.status === "completed" ? "Completed" :
                       b.status}
                    </span>
                    {!isProvider && b.status === "declined" && b.decline_reason && (
                      <p className="text-xs text-primary mt-1.5">Click to view reason</p>
                    )}
                    {!isProvider && b.status === "declined" && b.referred_provider && (
                      <p className="text-xs text-stone-600 mt-1.5">Suggested: {b.referred_provider.name}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-start gap-2">
                    {/* Patients can cancel pending/confirmed, Providers can cancel confirmed only */}
                    {((isProvider && b.status === "confirmed") || (!isProvider && (b.status === "pending" || b.status === "confirmed"))) && (
                      <button type="button" onClick={(e) => handleCancel(b.id, e)} disabled={cancellingId === b.id} className="text-sm text-primary hover:underline disabled:opacity-50">
                        {cancellingId === b.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                    {/* Only patients can remove cancelled/declined bookings */}
                    {!isProvider && (b.status === "cancelled" || b.status === "declined") && (
                      <button type="button" onClick={(e) => handleDelete(b.id, e)} disabled={deletingId === b.id} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50" title="Remove from list">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 4L4 12M4 4l8 8" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!isProvider && (
        <button type="button" onClick={() => navigate("/patient-search-and-booking")} className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">Back to find care</button>
      )}
      {isProvider && (
        <button type="button" onClick={() => navigate("/provider-dashboard-and-management")} className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">Back to dashboard</button>
      )}

      {/* Decline Reason Modal */}
      {showDeclineReason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeclineReason(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-stone-900">Reason for Denial</h3>
              <button type="button" onClick={() => setShowDeclineReason(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 4L4 12M4 4l8 8" />
                </svg>
              </button>
            </div>
            <p className="text-stone-700 leading-relaxed py-4">
              {formatDeclineReason(selectedDeclineReason)}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
