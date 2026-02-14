"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

type ProviderMatch = {
  id: string;
  name: string;
  role: string;
  services: string[];
  specialties: string[];
  rating: number;
  visit_count: number;
  price: number;
  next_available: string | null;
  photo_url: string | null;
  distance_km: number;
  nextAvailable?: string | null;
};

export default function HomePage() {
  const [where, setWhere] = useState("Current location");
  const [when, setWhen] = useState("");
  const [service, setService] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [bookingProviderId, setBookingProviderId] = useState<string | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showRequestBanner, setShowRequestBanner] = useState(false);
  const cardScrollRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("requested");
    if (q === "1") setShowRequestBanner(true);
  }, []);

  const filteredProviders = filterMinRating
    ? providers.filter((p) => {
        const min = parseFloat(filterMinRating);
        return !Number.isNaN(min) && p.rating >= min;
      })
    : providers;
  const displayProvidersFiltered = searched ? filteredProviders : [];

  // Get user location on load; initial provider load uses it once available (or SF fallback)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setWhere("Current location");
      },
      () => setWhere("Current location")
    );
  }, []);

  // Load providers on initial page load; use user lat/lng when available, else SF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const loadInitial = async (useLat: number, useLng: number) => {
      try {
        const params = new URLSearchParams({
          service: "nursing",
          lat: String(useLat),
          lng: String(useLng),
          limit: "10",
        });
        const res = await fetch(`/api/providers/match?${params}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.providers)) {
          setProviders((data.providers ?? []) as ProviderMatch[]);
          setSearched(true);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (e) {
        if (!cancelled) setError("Could not load providers. Check your connection and that the Supabase schema is set up.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    // Run once with SF so the page isn't empty; if we already have user location, use it
    loadInitial(lat ?? 37.77, lng ?? -122.42);
    return () => { cancelled = true; };
  }, []);

  // When user location arrives after initial load, re-fetch so "Where" matches results
  useEffect(() => {
    if (lat == null || lng == null || !searched) return;
    let cancelled = false;
    const params = new URLSearchParams({
      service: service.trim() || "nursing",
      lat: String(lat),
      lng: String(lng),
      limit: "10",
    });
    if (when) params.set("when", new Date(when).toISOString());
    fetch(`/api/providers/match?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.providers) return;
        setProviders((data.providers ?? []) as ProviderMatch[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lng, searched]);

  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filterOpen]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported.");
      return;
    }
    setError(null);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setWhere("Current location");
        setLoading(false);
      },
      () => {
        setError("Could not get your location.");
        setLoading(false);
      }
    );
  }, []);

  const search = useCallback(async () => {
    const useLat = lat ?? 37.77;
    const useLng = lng ?? -122.42;
    const serviceToUse = service.trim() || "nursing";
    setError(null);
    setSearched(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        service: serviceToUse,
        lat: String(useLat),
        lng: String(useLng),
        limit: "10",
      });
      if (when) params.set("when", new Date(when).toISOString());
      const res = await fetch(`/api/providers/match?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setProviders([]);
        setError(data.error || "Search failed.");
        return;
      }
      let list = (data.providers ?? []) as ProviderMatch[];
      if (doctorName.trim()) {
        const q = doctorName.trim().toLowerCase();
        list = list.filter((p: ProviderMatch) => p.name.toLowerCase().includes(q));
      }
      setProviders(list);
      setFilterMinRating("");
    } catch (e) {
      setProviders([]);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [service, when, lat, lng, doctorName]);

  const scrollCards = (dir: "left" | "right") => {
    if (!cardScrollRef.current) return;
    const step = cardScrollRef.current.clientWidth * 0.8;
    cardScrollRef.current.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  };

  const handleBook = async (p: ProviderMatch) => {
    setBookingProviderId(p.id);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify({
          providerId: p.id,
          service: service.trim() || "nursing",
          when: when || new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed.");
        return;
      }
      const bid = data.booking?.id;
      if (bid) {
        window.location.href = `/intake?bookingId=${encodeURIComponent(bid)}&providerId=${p.id}&service=${encodeURIComponent(service)}&when=${encodeURIComponent(when)}&where=${encodeURIComponent(where)}&booked=1`;
      } else {
        window.location.href = `/intake?providerId=${p.id}&service=${encodeURIComponent(service)}&when=${encodeURIComponent(when)}&where=${encodeURIComponent(where)}&booked=1`;
      }
    } catch (e) {
      setError("Network error. Try again.");
    } finally {
      setBookingProviderId(null);
    }
  };

  const showPlaceholderCards = !searched;

  const searchSimilarDates = useCallback(() => {
    const baseWhen = when ? new Date(when) : null;
    const similarWhen = baseWhen ? new Date(baseWhen.getTime() + 86400000).toISOString() : "";
    setWhen(similarWhen);
    const useLat = lat ?? 37.77;
    const useLng = lng ?? -122.42;
    const serviceToUse = service.trim() || "nursing";
    setError(null);
    setSearched(true);
    setLoading(true);
    const params = new URLSearchParams({
      service: serviceToUse,
      lat: String(useLat),
      lng: String(useLng),
      limit: "10",
    });
    if (similarWhen) params.set("when", similarWhen);
    fetch(`/api/providers/match?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) setProviders((data.providers ?? []) as ProviderMatch[]);
      })
      .catch(() => setError("Could not load providers."))
      .finally(() => setLoading(false));
  }, [when, lat, lng, service]);

  function dismissRequestBanner() {
    setShowRequestBanner(false);
    router.replace("/", { scroll: false });
  }

  return (
    <div className="space-y-10">
      {showRequestBanner && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3">
          <p className="text-emerald-900 text-sm">
            Your care request was posted. Providers can find it under Find open requests on the provider dashboard.
          </p>
          <button
            type="button"
            onClick={dismissRequestBanner}
            className="shrink-0 text-emerald-700 hover:text-emerald-900 p-1"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Horizontal search bar — single white bar, 4 segments + red search button */}
      <section className="flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-full shadow-lg border border-stone-100 flex items-stretch overflow-hidden">
          <button
            type="button"
            onClick={() => { setWhere("Current location"); useMyLocation(); }}
            className="flex-1 min-w-0 py-4 px-5 text-left hover:bg-stone-50 transition-colors"
          >
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Where</p>
            <p className="text-stone-900 font-medium truncate mt-0.5">{where}</p>
          </button>
          <div className="w-px bg-stone-200 self-stretch my-2" />
          <label className="flex-1 min-w-0 py-4 px-5 cursor-pointer hover:bg-stone-50 transition-colors relative">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Time</p>
            <span className={`block font-medium mt-0.5 ${when ? "text-stone-900" : "text-stone-400"}`}>
              {when ? formatTime(when) : "Desired visit time"}
            </span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
          <div className="w-px bg-stone-200 self-stretch my-2" />
          <div className="flex-1 min-w-0 py-4 px-5 hover:bg-stone-50 transition-colors">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Type of Care</p>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={`w-full font-medium bg-transparent border-0 p-0 mt-0.5 focus:outline-none focus:ring-0 cursor-pointer appearance-none ${service ? "text-stone-900" : "text-stone-400"}`}
            >
              <option value="">Services</option>
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="w-px bg-stone-200 self-stretch my-2" />
          <div className="flex-1 min-w-0 py-4 px-5 hover:bg-stone-50 transition-colors">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Name</p>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Name of Doctor"
              className="w-full text-stone-900 font-medium bg-transparent border-0 p-0 mt-0.5 focus:outline-none focus:ring-0 placeholder:text-stone-400"
            />
          </div>
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 shrink-0 self-center mr-2"
            aria-label="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>
      </section>

      {error && (
        <p className="text-center text-sm text-red-600" role="alert">{error}</p>
      )}

      {/* Providers near you — filter, heading, arrows, cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 relative" ref={filterRef}>
            <span className="text-stone-400 font-medium">|</span>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="text-stone-600 font-medium hover:text-stone-900"
            >
              Filter
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-full mt-1 z-10 bg-white rounded-xl border border-stone-200 shadow-lg p-3 min-w-[160px]">
                <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Min. rating</p>
                <select
                  value={filterMinRating}
                  onChange={(e) => setFilterMinRating(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                >
                  <option value="">Any</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                  <option value="4.8">4.8+ stars</option>
                </select>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-900">Providers near you</h2>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => scrollCards("left")}
                className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 flex items-center justify-center"
                aria-label="Previous"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollCards("right")}
                className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 flex items-center justify-center"
                aria-label="Next"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shrink-0 w-40 h-48 rounded-3xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (displayProvidersFiltered.length > 0 || showPlaceholderCards) && !(searched && displayProvidersFiltered.length === 0) && (
          <>
            <div
              ref={cardScrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(displayProvidersFiltered.length ? displayProvidersFiltered : Array.from({ length: 5 }, (_, i) => null)).map((p, i) =>
                p ? (
                  <div
                    key={p.id}
                    className="shrink-0 w-40 flex flex-col items-center"
                  >
                    <Link
                      href={`/provider/${p.id}`}
                      className="block w-full"
                    >
                      <div className="w-40 h-40 rounded-3xl overflow-hidden bg-sky-100 flex items-center justify-center">
                        <img
                          src={p.photo_url || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-semibold text-stone-900 mt-2 text-center text-sm truncate w-full px-1" title={p.name}>
                        {p.name}
                      </p>
                      <p className="font-bold text-stone-700 mt-0.5 text-center text-xs">
                        Specialty: {Array.isArray(p.specialties) && p.specialties[0] ? p.specialties[0] : p.role || "Care"}
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleBook(p)}
                      disabled={bookingProviderId === p.id}
                      className="mt-2 text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
                    >
                      {bookingProviderId === p.id ? "Booking…" : "Book"}
                    </button>
                  </div>
                ) : (
                  <div key={`placeholder-${i}`} className="shrink-0 w-40 flex flex-col items-center">
                    <div className="w-40 h-40 rounded-3xl bg-stone-200" />
                    <p className="font-bold text-stone-400 mt-2 text-center text-sm">Specialty: —</p>
                  </div>
                )
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={searchSimilarDates}
                className="text-stone-900 font-medium hover:underline"
              >
                See providers for tomorrow &gt;
              </button>
              <p className="text-xs text-stone-500 mt-0.5">Same search, next day.</p>
            </div>
          </>
        )}

        {searched && !loading && displayProvidersFiltered.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <p className="text-stone-600 mb-2">
              {providers.length === 0
                ? "No providers found. Try a different service or location, or increase the search radius."
                : "No providers match the current filter. Clear the filter or try a different service."}
            </p>
            {filterMinRating ? (
              <button
                type="button"
                onClick={() => setFilterMinRating("")}
                className="text-red-500 font-medium hover:underline"
              >
                Clear filter
              </button>
            ) : (
              <Link href="/request-care" className="text-red-500 font-medium hover:underline">
                Request care instead →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
