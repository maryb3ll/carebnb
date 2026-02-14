"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProviderRef = { id: string; name: string; role: string; photo_url?: string | null };
type BookingDetail = {
  id: string;
  service: string;
  scheduled_at: string;
  status: string;
  patient_name?: string | null;
  patient_phone?: string | null;
  decline_reason?: string | null;
  referred_provider_id?: string | null;
  provider?: ProviderRef | null;
  referred_provider?: { id: string; name: string; role: string } | null;
};

function ConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [me, setMe] = useState<{ providerId: string | null } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [referredProviderId, setReferredProviderId] = useState("");
  const [referralOptions, setReferralOptions] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const headers: HeadersInit = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      fetch("/api/me", { headers })
        .then((r) => r.json())
        .then((data) => setMe({ providerId: data.providerId ?? null }))
        .catch(() => setMe(null));
    });
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/bookings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data);
        }
      })
      .catch(() => setError("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!showDeclineModal || !booking?.service || !booking?.provider?.id) return;
    setLoadingReferrals(true);
    const params = new URLSearchParams({
      service: booking.service,
      lat: "37.77",
      lng: "-122.42",
      limit: "20",
    });
    fetch(`/api/providers/match?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list = (data.providers ?? []).filter(
          (p: { id: string }) => p.id !== booking.provider?.id
        );
        setReferralOptions(list.map((p: { id: string; name: string; role: string }) => ({ id: p.id, name: p.name, role: p.role })));
      })
      .catch(() => setReferralOptions([]))
      .finally(() => setLoadingReferrals(false));
  }, [showDeclineModal, booking?.service, booking?.provider?.id]);

  if (!id) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-stone-600">No booking specified.</p>
        <Link href="/bookings" className="text-red-500 font-medium hover:underline mt-2 inline-block">
          My bookings
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 text-stone-500">
        Loading…
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-stone-600">{error || "Booking not found."}</p>
        <Link href="/bookings" className="text-red-500 font-medium hover:underline mt-2 inline-block">
          My bookings
        </Link>
      </div>
    );
  }

  const date = new Date(booking.scheduled_at).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const isProvider = !!me?.providerId && booking.provider?.id && me.providerId === booking.provider.id;

  async function handleProviderStatus(status: "confirmed" | "completed") {
    setUpdatingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (res.ok) setBooking((b) => (b ? { ...b, status } : b));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDeclineSubmit() {
    const reason = declineReason.trim();
    if (!reason) return;
    setDeclining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const body: { status: string; decline_reason: string; referred_provider_id?: string } = {
        status: "declined",
        decline_reason: reason,
      };
      if (referredProviderId) body.referred_provider_id = referredProviderId;
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const refProvider = referralOptions.find((p) => p.id === referredProviderId);
        setBooking((b) =>
          b
            ? {
                ...b,
                status: "declined",
                decline_reason: reason,
                referred_provider_id: referredProviderId || null,
                referred_provider: refProvider ?? null,
              }
            : b
        );
        setShowDeclineModal(false);
        setDeclineReason("");
        setReferredProviderId("");
      }
    } finally {
      setDeclining(false);
    }
  }

  const isDeclined = booking.status === "declined";

  return (
    <div className="max-w-xl mx-auto">
      {isDeclined ? (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
          <h1 className="text-2xl font-semibold text-amber-900 mb-1">
            Booking declined
          </h1>
          <p className="text-amber-800 mb-2">
            {isProvider ? "You declined this request." : "The provider declined this booking."}
          </p>
          {booking.decline_reason && (
            <p className="text-amber-900 text-sm mt-2"><strong>Reason:</strong> {booking.decline_reason}</p>
          )}
          {booking.referred_provider && (
            <p className="text-sm mt-2">
              <strong>Suggested alternative:</strong>{" "}
              <Link href={`/provider/${booking.referred_provider.id}`} className="text-red-600 font-medium hover:underline">
                {booking.referred_provider.name} · {booking.referred_provider.role}
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
          <h1 className="text-2xl font-semibold text-emerald-900 mb-1">
            {isProvider && booking.status === "pending"
              ? "Booking request"
              : !isProvider && booking.status === "pending"
              ? "Booking requested"
              : "Booking confirmed"}
          </h1>
          <p className="text-emerald-800">
            {isProvider && booking.status === "pending"
              ? "Accept or decline this request and optionally suggest another provider."
              : !isProvider && booking.status === "pending"
              ? "Your provider will confirm soon. We'll update you once they accept."
              : "Your care visit is scheduled. Your provider may contact you before the visit."}
          </p>
        </div>
      )}
      <dl className="space-y-3 text-stone-700">
        {booking.provider && (
          <>
            <div>
              <dt className="text-sm text-stone-500">Provider</dt>
              <dd className="font-medium">{booking.provider.name} · {booking.provider.role}</dd>
            </div>
          </>
        )}
        <div>
          <dt className="text-sm text-stone-500">Service</dt>
          <dd className="font-medium capitalize">{booking.service.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Date & time</dt>
          <dd className="font-medium">{date}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Status</dt>
          <dd className="font-medium capitalize">{booking.status}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/bookings"
          className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
        >
          My bookings
        </Link>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
        >
          Find more care
        </Link>
        {isProvider && booking.status === "pending" && (
          <>
            <button
              type="button"
              onClick={() => handleProviderStatus("confirmed")}
              disabled={updatingStatus}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              {updatingStatus ? "…" : "Accept"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeclineModal(true)}
              disabled={updatingStatus}
              className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-100 disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}
        {isProvider && booking.status === "confirmed" && (
          <button
            type="button"
            onClick={() => handleProviderStatus("completed")}
            disabled={updatingStatus}
            className="px-6 py-2.5 rounded-xl bg-stone-600 text-white font-medium hover:bg-stone-700 disabled:opacity-50"
          >
            {updatingStatus ? "…" : "Mark complete"}
          </button>
        )}
        {!isProvider && (booking.status === "pending" || booking.status === "confirmed") && id && (
          <button
            type="button"
            onClick={async () => {
              setCancelling(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers: HeadersInit = { "Content-Type": "application/json" };
                if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
                const res = await fetch(`/api/bookings/${id}`, {
                  method: "PATCH",
                  headers,
                  body: JSON.stringify({ status: "cancelled" }),
                });
                if (res.ok) router.push("/bookings");
              } finally {
                setCancelling(false);
              }
            }}
            disabled={cancelling}
            className="px-6 py-2.5 rounded-xl border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel booking"}
          </button>
        )}
      </div>

      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="decline-modal-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 id="decline-modal-title" className="text-xl font-semibold text-stone-900 mb-4">
              Decline this booking
            </h2>
            <p className="text-stone-600 text-sm mb-4">
              Let the patient know why you can&apos;t take this request. You can optionally suggest another provider.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="decline-reason" className="block text-sm font-medium text-stone-700 mb-1">
                  Reason for declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="decline-reason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, outside my service area..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label htmlFor="referral-provider" className="block text-sm font-medium text-stone-700 mb-1">
                  Suggest an alternative provider
                </label>
                <select
                  id="referral-provider"
                  value={referredProviderId}
                  onChange={(e) => setReferredProviderId(e.target.value)}
                  disabled={loadingReferrals}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 disabled:opacity-50"
                >
                  <option value="">None</option>
                  {referralOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.role}
                    </option>
                  ))}
                </select>
                {loadingReferrals && <p className="text-xs text-stone-500 mt-1">Loading providers…</p>}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowDeclineModal(false); setDeclineReason(""); setReferredProviderId(""); }}
                disabled={declining}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={declining || !declineReason.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {declining ? "Declining…" : "Decline & send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto p-4 text-stone-500">Loading…</div>}>
      <ConfirmedContent />
    </Suspense>
  );
}
