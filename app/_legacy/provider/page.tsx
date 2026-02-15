"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SERVICE_OPTIONS = [
  { value: "nursing", label: "Nursing" },
  { value: "companion", label: "Companion" },
  { value: "personal_care", label: "Personal care" },
  { value: "medication", label: "Medication" },
  { value: "wound_care", label: "Wound care" },
  { value: "transport", label: "Transport" },
];

type RequestMatch = {
  id: string;
  patientId: string | null;
  service: string;
  description: string | null;
  requestedStart: string;
  status: string;
  distanceKm: number;
};

type ProviderJob = {
  id: string;
  service: string;
  scheduled_at: string;
  status: string;
  patient_name?: string | null;
  patient_phone?: string | null;
};

export default function ProviderPage() {
  const [service, setService] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [myJobs, setMyJobs] = useState<ProviderJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [me, setMe] = useState<{ user: { email?: string } | null; providerId: string | null } | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", role: "Caregiver", services: ["companion"] as string[] });
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    const res = await fetch("/api/me", { headers });
    const data = await res.json();
    setMe({ user: data.user, providerId: data.providerId ?? null });
    setMeLoading(false);
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/bookings?for=provider", { headers });
      const data = await res.json();
      setMyJobs(data.bookings ?? []);
      setJobsLoading(false);
    };
    load();
  }, [me?.providerId]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setError("Could not get your location. Please allow location access.");
        setLoading(false);
      }
    );
  }, []);

  const findRequests = useCallback(async () => {
    const useLat = lat ?? 37.77;
    const useLng = lng ?? -122.42;
    if (!service.trim()) {
      setError("Please select a service.");
      return;
    }
    setError(null);
    setSearched(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        service: service.trim(),
        lat: String(useLat),
        lng: String(useLng),
        limit: "20",
      });
      const res = await fetch(`/api/requests/match?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setRequests([]);
        setError(data.error || "Search failed.");
        return;
      }
      setRequests(data.requests ?? []);
    } catch (e) {
      setRequests([]);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [service, lat, lng]);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const todaysVisits = myJobs.filter((j) => {
    const t = new Date(j.scheduled_at).getTime();
    return t >= startOfToday.getTime() && t < endOfToday.getTime() && j.status !== "cancelled" && j.status !== "declined";
  });
  const upcomingBookings = myJobs.filter((j) => {
    const t = new Date(j.scheduled_at).getTime();
    return t >= endOfToday.getTime() && j.status !== "cancelled" && j.status !== "declined";
  });

  async function handleJobStatus(jobId: string, status: "confirmed" | "completed", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUpdatingJobId(jobId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/bookings/${jobId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMyJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
      }
    } finally {
      setUpdatingJobId(null);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!registerForm.name.trim()) return;
    setError(null);
    setRegistering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      const res = await fetch("/api/providers/register", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: registerForm.name.trim(),
          role: registerForm.role.trim(),
          services: registerForm.services,
          lat: lat ?? 37.77,
          lng: lng ?? -122.42,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }
      await loadMe();
    } catch {
      setError("Something went wrong.");
    } finally {
      setRegistering(false);
    }
  }

  const showRegisterForm = !meLoading && me?.user && !me?.providerId;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900 mb-1">
          Provider dashboard
        </h1>
        <p className="text-stone-600">
          Find nearby open care requests and manage your jobs.
        </p>
      </div>

      {!meLoading && !me?.user && (
        <div className="rounded-2xl border border-stone-200 bg-amber-50 p-4 text-stone-700 text-sm">
          <Link href="/login" className="text-red-500 font-medium hover:underline">Log in</Link>
          {" "}to register as a provider and see &quot;My jobs&quot; here.
        </div>
      )}

      {showRegisterForm && (
        <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 max-w-xl">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Register as a provider</h2>
          <p className="text-stone-600 text-sm mb-4">
            Link your account to a provider profile so you can see &quot;My jobs&quot; and get booked by patients.
          </p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-stone-700 mb-1">Your name</label>
              <input
                id="reg-name"
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="Full name"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900"
              />
            </div>
            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-stone-700 mb-1">Role</label>
              <select
                id="reg-role"
                value={registerForm.role}
                onChange={(e) => setRegisterForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900"
              >
                <option value="Caregiver">Caregiver</option>
                <option value="CNA">CNA</option>
                <option value="LVN">LVN</option>
                <option value="RN">RN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Services you offer</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={registerForm.services.includes(o.value)}
                      onChange={(e) => {
                        setRegisterForm((f) => ({
                          ...f,
                          services: e.target.checked
                            ? [...f.services, o.value]
                            : f.services.filter((s) => s !== o.value),
                        }));
                      }}
                      className="rounded border-stone-300 text-red-500"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-stone-600 mb-1">Location (for search)</p>
              <button type="button" onClick={useMyLocation} className="text-sm text-red-500 font-medium hover:underline">
                Use my location
              </button>
              {lat != null && lng != null && <span className="ml-2 text-sm text-stone-500">{lat.toFixed(2)}, {lng.toFixed(2)}</span>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={registering} className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50">
              {registering ? "Registering…" : "Register as provider"}
            </button>
          </form>
        </section>
      )}

      {!showRegisterForm && me?.providerId && (
        <>
          <section className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-1">Today&apos;s visits</h2>
              <p className="text-sm text-stone-500 mb-3">Visits scheduled for today</p>
              {jobsLoading ? (
                <p className="text-stone-500 text-sm">Loading…</p>
              ) : todaysVisits.length === 0 ? (
                <p className="text-stone-600 text-sm">No visits today.</p>
              ) : (
                <ul className="space-y-2">
                  {todaysVisits.map((j) => (
                    <li key={j.id}>
                      <Link href={`/booking/confirmed?id=${j.id}`} className="block rounded-xl border border-stone-100 p-3 hover:bg-stone-50">
                        <p className="font-medium text-stone-900 text-sm capitalize">{j.service.replace(/_/g, " ")}</p>
                        <p className="text-xs text-stone-600">
                          {new Date(j.scheduled_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                          {j.patient_name && ` · ${j.patient_name}`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-1">Upcoming bookings</h2>
              <p className="text-sm text-stone-500 mb-3">Future scheduled visits</p>
              {jobsLoading ? (
                <p className="text-stone-500 text-sm">Loading…</p>
              ) : upcomingBookings.length === 0 ? (
                <p className="text-stone-600 text-sm">No upcoming bookings.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingBookings.slice(0, 5).map((j) => (
                    <li key={j.id}>
                      <Link href={`/booking/confirmed?id=${j.id}`} className="block rounded-xl border border-stone-100 p-3 hover:bg-stone-50">
                        <p className="font-medium text-stone-900 text-sm capitalize">{j.service.replace(/_/g, " ")}</p>
                        <p className="text-xs text-stone-600">
                          {formatTime(j.scheduled_at)}
                          {j.patient_name && ` · ${j.patient_name}`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {upcomingBookings.length > 5 && (
                <p className="text-xs text-stone-500 mt-2">+{upcomingBookings.length - 5} more in My jobs below</p>
              )}
            </div>
          </section>

          <section>
          <h2 className="text-xl font-semibold text-stone-900 mb-4">My jobs</h2>
          {jobsLoading ? (
            <p className="text-stone-500">Loading…</p>
          ) : myJobs.length === 0 ? (
            <p className="text-stone-600">No jobs yet. Patients can book you from the Find care page.</p>
          ) : (
            <ul className="space-y-3">
              {myJobs.map((j) => (
                <li key={j.id}>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 hover:shadow-md flex items-start justify-between gap-3">
                    <Link href={`/booking/confirmed?id=${j.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 capitalize">{j.service.replace(/_/g, " ")}</p>
                      <p className="text-sm text-stone-600">
                        {new Date(j.scheduled_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        {j.patient_name && ` · ${j.patient_name}`}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                        j.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                        j.status === "completed" ? "bg-stone-100 text-stone-700" :
                        j.status === "cancelled" ? "bg-red-100 text-red-800" :
                        j.status === "declined" ? "bg-amber-100 text-amber-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {j.status}
                      </span>
                    </Link>
                    {j.status !== "cancelled" && j.status !== "completed" && (
                      <div className="flex flex-col gap-1 shrink-0">
                        {j.status === "pending" && (
                          <button
                            type="button"
                            onClick={(e) => handleJobStatus(j.id, "confirmed", e)}
                            disabled={updatingJobId === j.id}
                            className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                          >
                            {updatingJobId === j.id ? "…" : "Confirm"}
                          </button>
                        )}
                        {j.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={(e) => handleJobStatus(j.id, "completed", e)}
                            disabled={updatingJobId === j.id}
                            className="text-xs font-medium text-stone-600 hover:underline disabled:opacity-50"
                          >
                            {updatingJobId === j.id ? "…" : "Mark complete"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 max-w-2xl">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Service
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">Select service</option>
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 disabled:opacity-50"
          >
            Use my location
          </button>
          <button
            type="button"
            onClick={findRequests}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Find open requests"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {searched && (
        <section>
          <h2 className="text-xl font-semibold text-stone-900 mb-4">
            Open requests
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse"
                >
                  <div className="h-5 bg-stone-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-stone-100 rounded w-full" />
                  <div className="h-4 bg-stone-100 rounded w-2/3 mt-2" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-stone-600 mb-2">
                No open requests found for this service and location.
              </p>
              <p className="text-sm text-stone-500">
                Patients can post requests from the &quot;Request care&quot; page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium uppercase">
                        {r.status}
                      </span>
                      <span className="ml-2 text-sm text-stone-500">
                        {r.distanceKm.toFixed(1)} km away
                      </span>
                    </div>
                    <p className="text-sm font-medium text-stone-700">
                      {formatTime(r.requestedStart)}
                    </p>
                  </div>
                  <p className="mt-2 text-stone-900 font-medium capitalize">
                    {r.service.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-stone-600 text-sm line-clamp-2">
                    {r.description || "No description."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
