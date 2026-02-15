import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export type MatchProviderRow = {
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
  total_count?: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const when = searchParams.get("when"); // ISO string
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "50";
  const limit = searchParams.get("limit") || "10";

  if (!service?.trim()) {
    return NextResponse.json(
      { error: "Missing required parameter: service" },
      { status: 400 }
    );
  }
  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: "Missing or invalid lat/lng" },
      { status: 400 }
    );
  }

  const whenDate = when ? new Date(when) : null;
  if (when && (Number.isNaN(whenDate!.getTime()))) {
    return NextResponse.json(
      { error: "Invalid 'when' date" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.rpc("match_providers", {
      p_service: service.trim(),
      p_lat: latNum,
      p_lng: lngNum,
      p_when: whenDate?.toISOString() ?? null,
      p_radius_km: parseFloat(radius) || 50,
      p_limit_n: Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50),
    });

    if (error) {
      console.error("match_providers RPC error:", error);
      return NextResponse.json(
        { error: "Failed to match providers", details: error.message },
        { status: 500 }
      );
    }

    const list = (data ?? []) as MatchProviderRow[];
    const total = list.length > 0 && list[0].total_count != null ? list[0].total_count : list.length;
    return NextResponse.json({
      providers: list.map(({ total_count: _tc, ...p }) => ({
        ...p,
        nextAvailable: p.next_available,
      })),
      total,
    });
  } catch (err) {
    console.error("match_providers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
