import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPatientIdForUser, DEMO_PATIENT_ID } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const patientId = accessToken ? await getPatientIdForUser(accessToken) : null;
  const resolvedPatientId = patientId ?? DEMO_PATIENT_ID;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    service,
    description,
    requested_start,
    lat,
    lng,
  } = body as {
    service?: string;
    description?: string;
    requested_start?: string;
    lat?: number;
    lng?: number;
  };

  if (!service?.trim()) {
    return NextResponse.json({ error: "Missing required field: service" }, { status: 400 });
  }
  const startDate = requested_start ? new Date(requested_start) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Missing or invalid requested_start" }, { status: 400 });
  }
  const useLat = lat ?? 37.77;
  const useLng = lng ?? -122.42;
  if (typeof useLat !== "number" || typeof useLng !== "number") {
    return NextResponse.json({ error: "Missing or invalid lat/lng" }, { status: 400 });
  }

  try {
    const { data: row, error } = await supabase
      .from("care_requests")
      .insert({
        patient_id: resolvedPatientId,
        service: service.trim(),
        description: description?.trim() || null,
        requested_start: startDate.toISOString(),
        location: `POINT(${useLng} ${useLat})`,
        status: "open",
      })
      .select("id, status, requested_start")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      careRequest: { id: row.id, status: row.status, requestedStart: row.requested_start },
    });
  } catch (err) {
    console.error("care-requests POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
