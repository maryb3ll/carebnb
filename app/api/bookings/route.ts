import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPatientIdForUser, getProviderIdForUser, DEMO_PATIENT_ID } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const patientId = accessToken
    ? await getPatientIdForUser(accessToken)
    : null;
  const resolvedPatientId = patientId ?? DEMO_PATIENT_ID;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    providerId,
    service,
    when,
    careRequestId,
  } = body as { providerId?: string; service?: string; when?: string; careRequestId?: string };

  if (!providerId?.trim() || !service?.trim() || !when?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields: providerId, service, when" },
      { status: 400 }
    );
  }

  const scheduledAt = new Date(when);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid 'when' date" },
      { status: 400 }
    );
  }

  try {
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        provider_id: providerId.trim(),
        patient_id: resolvedPatientId,
        care_request_id: careRequestId?.trim() || null,
        service: service.trim(),
        scheduled_at: scheduledAt.toISOString(),
        status: "pending",
      })
      .select("id, status, scheduled_at")
      .single();

    if (insertError) {
      console.error("bookings insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create booking", details: insertError.message },
        { status: 500 }
      );
    }

    if (careRequestId?.trim()) {
      await supabase
        .from("care_requests")
        .update({ status: "matched", updated_at: new Date().toISOString() })
        .eq("id", careRequestId.trim());
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledAt: booking.scheduled_at,
      },
    });
  } catch (err) {
    console.error("bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET list of bookings: patient (default) or provider (?for=provider). */
export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const forParam = request.nextUrl.searchParams.get("for");
  const isProvider = forParam === "provider";

  if (isProvider) {
    const providerId = accessToken ? await getProviderIdForUser(accessToken) : null;
    if (!providerId) {
      return NextResponse.json({ bookings: [] });
    }
    const { data: rows, error } = await supabase
      .from("bookings")
      .select(`
        id,
        service,
        scheduled_at,
        status,
        patient_name,
        patient_phone
      `)
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ bookings: rows ?? [] });
  }

  const patientId = accessToken ? await getPatientIdForUser(accessToken) : null;
  if (!patientId) {
    return NextResponse.json({ bookings: [] });
  }
  const { data: rows, error } = await supabase
    .from("bookings")
    .select(`
      id,
      service,
      scheduled_at,
      status,
      patient_name,
      provider:providers!provider_id(id, name, role, photo_url),
      referred_provider:providers!referred_provider_id(id, name, role)
    `)
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const bookings = (rows ?? []).map((r: { provider?: unknown; referred_provider?: unknown }) => {
    const provider = Array.isArray(r.provider) ? r.provider[0] : r.provider;
    const referredProvider = Array.isArray(r.referred_provider) ? r.referred_provider[0] : r.referred_provider;
    const { referred_provider, ...rest } = r;
    return { ...rest, provider, referred_provider: referredProvider ?? null };
  });
  return NextResponse.json({ bookings });
}
