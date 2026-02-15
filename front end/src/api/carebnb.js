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

export default { getProviders, mapProviderFromApi };
