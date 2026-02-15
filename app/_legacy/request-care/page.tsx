"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SERVICE_OPTIONS = [
  { value: "nursing", label: "Nursing" },
  { value: "companion", label: "Companion" },
  { value: "personal_care", label: "Personal care" },
  { value: "medication", label: "Medication" },
  { value: "wound_care", label: "Wound care" },
  { value: "transport", label: "Transport" },
];

export default function RequestCarePage() {
  const router = useRouter();
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [requestedStart, setRequestedStart] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setError("Could not get your location.")
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service.trim()) {
      setError("Please select a service.");
      return;
    }
    const start = requestedStart ? new Date(requestedStart) : new Date(Date.now() + 86400000);
    if (Number.isNaN(start.getTime())) {
      setError("Please pick a valid date and time.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/care-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({
          service: service.trim(),
          description: description.trim() || undefined,
          requested_start: start.toISOString(),
          lat: lat ?? 37.77,
          lng: lng ?? -122.42,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create request.");
        return;
      }
      router.push("/?requested=1");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-stone-900 mb-2">Request care</h1>
      <p className="text-stone-600 mb-6">
        Post an open request. Providers in your area will see it and can reach out.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-stone-700 mb-1">
            Service
          </label>
          <select
            id="service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select service</option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you need? (e.g. medication help, companionship, morning routine)"
            rows={3}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label htmlFor="requested_start" className="block text-sm font-medium text-stone-700 mb-1">
            Preferred date & time
          </label>
          <input
            id="requested_start"
            type="datetime-local"
            value={requestedStart}
            onChange={(e) => setRequestedStart(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <p className="block text-sm font-medium text-stone-700 mb-1">Location</p>
          <button
            type="button"
            onClick={useMyLocation}
            className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-medium hover:bg-stone-200"
          >
            Use my location
          </button>
          {lat != null && lng != null && (
            <p className="mt-1 text-sm text-stone-500">
              Using: {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post request"}
        </button>
      </form>
      <Link href="/" className="inline-block mt-6 text-sm text-stone-500 hover:text-stone-700">
        ← Back to find care
      </Link>
    </div>
  );
}
