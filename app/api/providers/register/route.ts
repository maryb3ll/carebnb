import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser, getProviderIdForUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const user = await getAuthUser(accessToken);
  if (!user) {
    return NextResponse.json({ error: "Must be logged in to register as a provider" }, { status: 401 });
  }
  const existing = await getProviderIdForUser(accessToken);
  if (existing) {
    return NextResponse.json({ error: "You already have a provider profile" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, role, services, lat, lng } = body as {
    name?: string;
    role?: string;
    services?: string[];
    lat?: number;
    lng?: number;
  };

  if (!name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "Missing required fields: name, role" }, { status: 400 });
  }
  const servicesArr = Array.isArray(services) && services.length > 0
    ? services.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
    : ["companion"];
  const useLat = typeof lat === "number" ? lat : 37.77;
  const useLng = typeof lng === "number" ? lng : -122.42;

  const { data: provider, error } = await supabase
    .from("providers")
    .insert({
      name: name.trim(),
      role: role.trim(),
      services: servicesArr,
      specialties: [role.trim().toLowerCase()],
      rating: 0,
      visit_count: 0,
      price: 0,
      next_available: new Date().toISOString(),
      location: `POINT(${useLng} ${useLat})`,
      user_id: user.id,
    })
    .select("id, name, role")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ provider: { id: provider.id, name: provider.name, role: provider.role } });
}
