/**
 * CareBnB backend API client (Next.js API routes).
 * Set VITE_API_BASE to your Next.js server when running Vite dev separately (e.g. http://localhost:3001).
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function mapProviderFromApi(p) {
  if (!p) return null;
  const nextAvailable = p.next_available || p.nextAvailable
    ? new Date(p.next_available || p.nextAvailable).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
    : "—";
  const rawNext = p.next_available || p.nextAvailable;
  return {
    id: p.id,
    name: p.name,
    specialty: p.role || p.specialty || "",
    image: p.photo_url || p.photoUrl || p.image || "",
    imageAlt: `${p.name}, ${p.role || ""}`.trim(),
    rating: Number(p.rating) || 0,
    reviews: p.visit_count ?? p.visit_count ?? 0,
    distance: (p.distance_km != null ? p.distance_km * 0.621371 : 0).toFixed(1),
    nextAvailable: nextAvailable,
    nextAvailableDate: rawNext ? new Date(rawNext) : null,
    available: true,
    credentials: Array.isArray(p.specialties) ? p.specialties : [p.role].filter(Boolean),
    bio: "",
  };
}

export async function getProviders(options = {}) {
  const { service = "nursing", lat = 37.44, lng = -122.17, when, limit = 20 } = options;
  const params = new URLSearchParams({ service, lat: String(lat), lng: String(lng), limit: String(limit) });
  if (when) params.set("when", new Date(when).toISOString());
  const res = await fetch(`${API_BASE}/api/providers/match?${params}`);
  if (!res.ok) throw new Error("Failed to fetch providers");
  const data = await res.json();
  const list = (data.providers || data) || [];
  const total = data.total != null ? data.total : list.length;
  return { list: list.map(mapProviderFromApi), total };
}

/**
 * Create a booking (patient). Pass Supabase session access_token for auth.
 * @param {{ providerId: string; service: string; when: string; careRequestId?: string; intake_keywords?: string[]; intake_transcript?: string; intake_session_id?: string }} payload
 * @param {string | null | undefined} accessToken
 */
export async function createBooking(payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to create booking");
  return data;
}

/**
 * Fetch bookings for the logged-in provider. Pass Supabase session access_token.
 * Returns { bookings, providerLinked } where providerLinked is false if the auth user is not linked to a provider row.
 * @param {string | null | undefined} accessToken
 */
export async function getProviderBookings(accessToken) {
  const res = await fetch(`${API_BASE}/api/bookings?for=provider`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to fetch bookings");
  return { bookings: data.bookings ?? [], providerLinked: data.providerLinked };
}

/**
 * Update a booking (e.g. confirm or decline). Pass Supabase session access_token.
 * @param {string} bookingId
 * @param {{ status: string; decline_reason?: string }} payload
 * @param {string | null | undefined} accessToken
 */
export async function updateBooking(bookingId, payload, accessToken) {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update booking");
  return data;
}

export default { getProviders, mapProviderFromApi, createBooking, getProviderBookings, updateBooking };
