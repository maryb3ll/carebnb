import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export type MatchRequestRow = {
  id: string;
  patient_id: string | null;
  service: string;
  description: string | null;
  requested_start: string;
  status: string;
  distance_km: number;
  pdf_url: string | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "50";
  const limit = searchParams.get("limit") || "20";

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

  try {
    const { data, error } = await supabase.rpc("match_requests", {
      p_service: service.trim(),
      p_lat: latNum,
      p_lng: lngNum,
      p_radius_km: parseFloat(radius) || 50,
      p_limit_n: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
    });

    if (error) {
      console.error("match_requests RPC error:", error);
      return NextResponse.json(
        { error: "Failed to match requests", details: error.message },
        { status: 500 }
      );
    }

    const list = (data ?? []) as MatchRequestRow[];
    return NextResponse.json({
      requests: list.map((r) => ({
        id: r.id,
        patientId: r.patient_id,
        service: r.service,
        description: r.description,
        requestedStart: r.requested_start,
        status: r.status,
        distanceKm: r.distance_km,
        pdfUrl: r.pdf_url,
      })),
    });
  } catch (err) {
    console.error("match_requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
