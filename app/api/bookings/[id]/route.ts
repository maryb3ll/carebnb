import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPatientIdForUser, getProviderIdForUser, DEMO_PATIENT_ID } from "@/lib/auth";

/** GET one booking by id (for confirmation page). Returns booking + provider name. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      service,
      scheduled_at,
      status,
      patient_name,
      patient_phone,
      address_notes,
      decline_reason,
      referred_provider_id,
      provider:providers!provider_id(id, name, role, photo_url),
      referred_provider:providers!referred_provider_id(id, name, role)
    `)
    .eq("id", id)
    .single();
  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const provider = Array.isArray(booking.provider) ? booking.provider[0] : booking.provider;
  const referredProvider = (booking as { referred_provider?: unknown[] | unknown }).referred_provider;
  const referredProviderResolved = Array.isArray(referredProvider) ? referredProvider[0] : referredProvider;
  const { referred_provider, ...rest } = booking as { referred_provider?: unknown };
  return NextResponse.json({
    ...rest,
    provider: provider ?? null,
    referred_provider: referredProviderResolved ?? null,
  });
}

/** PATCH booking: patient (intake fields, cancel) or provider (confirm, complete). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const [patientId, providerId] = await Promise.all([
    accessToken ? getPatientIdForUser(accessToken) : null,
    accessToken ? getProviderIdForUser(accessToken) : null,
  ]);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    patient_name,
    patient_phone,
    address_notes,
    consent,
    status: newStatus,
    decline_reason,
    referred_provider_id,
  } = body as {
    patient_name?: string;
    patient_phone?: string;
    address_notes?: string;
    consent?: boolean;
    status?: string;
    decline_reason?: string;
    referred_provider_id?: string;
  };

  const { data: existing } = await supabase
    .from("bookings")
    .select("patient_id, provider_id, status, care_request_id")
    .eq("id", id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isPatient = existing.patient_id === DEMO_PATIENT_ID || patientId === existing.patient_id;
  const isProvider = providerId === existing.provider_id;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (isPatient) {
    if (patient_name !== undefined) updates.patient_name = patient_name;
    if (patient_phone !== undefined) updates.patient_phone = patient_phone;
    if (address_notes !== undefined) updates.address_notes = address_notes;
    if (consent !== undefined) updates.consent = consent === true;
    if (newStatus === "cancelled") updates.status = "cancelled";
  }
  if (isProvider) {
    if (newStatus === "confirmed" || newStatus === "completed" || newStatus === "cancelled") {
      updates.status = newStatus;
    } else if (newStatus === "declined") {
      updates.status = "declined";
      if (decline_reason !== undefined) updates.decline_reason = decline_reason;
      if (referred_provider_id !== undefined) updates.referred_provider_id = referred_provider_id || null;
    }
  }

  if (!isPatient && !isProvider) {
    return NextResponse.json({ error: "Not allowed to update this booking" }, { status: 403 });
  }

  console.log(`PATCH booking ${id} - Updates:`, updates);
  const { data: booking, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select("id, status, scheduled_at, care_request_id")
    .single();
  if (error) {
    console.error(`Failed to update booking ${id}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  console.log(`Booking ${id} updated successfully. New status: ${booking.status}, care_request_id: ${booking.care_request_id}`);

  // Update care_request status based on booking status
  if (booking.care_request_id) {
    let careRequestStatus: string | null = null;

    if (newStatus === "confirmed") {
      // Provider accepted the request
      careRequestStatus = "matched";
    } else if (newStatus === "declined") {
      // Provider declined - mark as closed so it doesn't show in pending requests
      // (using 'closed' instead of 'declined' because the DB constraint only allows: open, matched, closed)
      careRequestStatus = "closed";
    } else if (newStatus === "cancelled") {
      // Provider cancelled after confirming - only reopen if it was previously confirmed
      if (existing.status === "confirmed") {
        careRequestStatus = "open";
      }
    }

    if (careRequestStatus) {
      console.log(`Updating care_request ${booking.care_request_id} status to: ${careRequestStatus}`);
      const { error: careRequestError } = await supabase
        .from("care_requests")
        .update({ status: careRequestStatus, updated_at: new Date().toISOString() })
        .eq("id", booking.care_request_id);

      if (careRequestError) {
        console.error("Failed to update care_request status:", careRequestError);
      } else {
        console.log(`Successfully updated care_request ${booking.care_request_id} to status: ${careRequestStatus}`);
      }
    }
  } else {
    console.log("Booking has no care_request_id, skipping care_request status update");
  }

  return NextResponse.json({ booking });
}

/** DELETE booking: patient can delete cancelled/declined bookings. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const patientId = accessToken ? await getPatientIdForUser(accessToken) : null;

  const { data: existing } = await supabase
    .from("bookings")
    .select("patient_id, status")
    .eq("id", id)
    .single();
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isPatient = existing.patient_id === DEMO_PATIENT_ID || patientId === existing.patient_id;
  if (!isPatient) {
    return NextResponse.json({ error: "Not allowed to delete this booking" }, { status: 403 });
  }

  // Only allow deletion of cancelled or declined bookings
  if (existing.status !== "cancelled" && existing.status !== "declined") {
    return NextResponse.json({ error: "Can only delete cancelled or declined bookings" }, { status: 400 });
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
