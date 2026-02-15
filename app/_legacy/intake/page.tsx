"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function IntakeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const providerId = searchParams.get("providerId");
  const service = searchParams.get("service");
  const when = searchParams.get("when");
  const where = searchParams.get("where");
  const booked = searchParams.get("booked") === "1";

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId) return;
    setError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          patient_name: patientName.trim() || undefined,
          patient_phone: patientPhone.trim() || undefined,
          address_notes: addressNotes.trim() || undefined,
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save.");
        return;
      }
      router.push(`/booking/confirmed?id=${bookingId}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!bookingId && !providerId) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-stone-600 mb-4">No booking or provider selected.</p>
        <Link href="/" className="text-red-500 font-medium hover:underline">
          ← Find care
        </Link>
      </div>
    );
  }

  if (bookingId) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          Complete your booking
        </h1>
        {booked && (
          <p className="text-stone-600 mb-6">
            Your booking is created. Add your details below so your provider can reach you.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patient_name" className="block text-sm font-medium text-stone-700 mb-1">
              Your name
            </label>
            <input
              id="patient_name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="patient_phone" className="block text-sm font-medium text-stone-700 mb-1">
              Phone
            </label>
            <input
              id="patient_phone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label htmlFor="address_notes" className="block text-sm font-medium text-stone-700 mb-1">
              Address or visit notes
            </label>
            <textarea
              id="address_notes"
              value={addressNotes}
              onChange={(e) => setAddressNotes(e.target.value)}
              placeholder="Where to go, access instructions, etc."
              rows={3}
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border-stone-300 text-red-500 focus:ring-red-500"
            />
            <span className="text-sm text-stone-700">
              I agree to the terms and consent to this booking.
            </span>
          </label>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save & confirm"}
            </button>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
            >
              Cancel
            </Link>
          </div>
        </form>
        <Link href="/bookings" className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">
          View my bookings →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-4">
        Complete a booking first
      </h1>
      <p className="text-stone-600 mb-4">
        You need to book a provider before filling out intake. Go to Find care → choose a provider → click Book.
      </p>
      <Link href="/" className="inline-block px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600">
        Find care →
      </Link>
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto p-4 text-stone-500">Loading…</div>}>
      <IntakeContent />
    </Suspense>
  );
}
