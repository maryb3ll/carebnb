import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getPatientIdForUser, getProviderIdForUser, DEMO_PATIENT_ID } from "@/lib/auth";
import { getLocalTime, getLocalDate, getLocalDayOfWeek, normalizeTime } from "@/lib/timezone";

export async function POST(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const patientId = accessToken
    ? await getPatientIdForUser(accessToken)
    : null;

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
    skipAvailabilityCheck,
  } = body as { providerId?: string; service?: string; when?: string; careRequestId?: string; skipAvailabilityCheck?: boolean };

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

  // Default appointment duration: 60 minutes
  const durationMinutes = 60;
  const scheduledEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

  console.log(`Booking request: provider=${providerId}, when=${when}, scheduledAt=${scheduledAt.toISOString()}`);

  // === AVAILABILITY & CONFLICT CHECKING ===
  // Skip if this is a provider accepting a request (they're explicitly choosing to be available)
  if (!skipAvailabilityCheck) {

  // 1. Check if time falls within provider's working hours
  // Use local time to match provider's schedule (which is in local time)
  const dateStr = getLocalDate(scheduledAt);
  const dayOfWeek = getLocalDayOfWeek(scheduledAt);
  const timeStr = getLocalTime(scheduledAt);

  console.log(`Availability check: date=${dateStr}, dayOfWeek=${dayOfWeek}, time=${timeStr}`);

  // Check recurring schedule for this day
  const { data: recurringSchedule, error: scheduleQueryError } = await supabase
    .from("provider_availability")
    .select("*")
    .eq("provider_id", providerId.trim())
    .eq("availability_type", "recurring")
    .eq("day_of_week", dayOfWeek);

  console.log(`Recurring schedule query for provider=${providerId}, day=${dayOfWeek}:`, recurringSchedule);
  if (scheduleQueryError) {
    console.error('Error querying recurring schedule:', scheduleQueryError);
  }

  // Check for one-time overrides on this date
  const { data: oneTimeEntries } = await supabase
    .from("provider_availability")
    .select("*")
    .eq("provider_id", providerId.trim())
    .in("availability_type", ["one_time_available", "one_time_blocked"])
    .eq("specific_date", dateStr);

  // Determine if provider is available at this time
  let isWithinWorkingHours = false;
  let isBlocked = false;

  // Check for one-time blocks
  if (oneTimeEntries && oneTimeEntries.length > 0) {
    for (const entry of oneTimeEntries) {
      // Normalize database times to HH:MM format
      const entryStart = normalizeTime(entry.start_time);
      const entryEnd = normalizeTime(entry.end_time);

      if (!entry.is_available) {
        // Check if requested time overlaps with block
        if (timeStr >= entryStart && timeStr < entryEnd) {
          isBlocked = true;
          break;
        }
      } else if (entry.availability_type === "one_time_available") {
        // One-time availability override
        if (timeStr >= entryStart && timeStr < entryEnd) {
          isWithinWorkingHours = true;
        }
      }
    }
  }

  if (isBlocked) {
    return NextResponse.json(
      {
        error: "Time slot not available",
        conflicts: [{ type: "blocked", reason: "Provider unavailable at this time" }],
      },
      { status: 409 }
    );
  }

  // Check recurring schedule if no one-time override
  if (!isWithinWorkingHours && (!oneTimeEntries || oneTimeEntries.length === 0)) {
    if (recurringSchedule && recurringSchedule.length > 0) {
      for (const schedule of recurringSchedule) {
        // Normalize database times to HH:MM format
        const startTime = normalizeTime(schedule.start_time);
        const endTime = normalizeTime(schedule.end_time);
        console.log(`Checking if ${timeStr} is between ${startTime} and ${endTime}`);
        if (timeStr >= startTime && timeStr < endTime) {
          isWithinWorkingHours = true;
          console.log('✓ Time is within working hours');
          break;
        }
      }
    }
  }

  if (!isWithinWorkingHours) {
    console.log(`REJECTED: Time ${timeStr} on day ${dayOfWeek} is outside working hours`);
    console.log('Recurring schedule found:', recurringSchedule?.length || 0, 'entries');
    console.log('One-time entries found:', oneTimeEntries?.length || 0, 'entries');
    return NextResponse.json(
      {
        error: "Time slot not available",
        conflicts: [{ type: "outside_hours", reason: "Provider not working at this time" }],
      },
      { status: 409 }
    );
  }

  // 2. Check for booking conflicts
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("scheduled_at, duration_minutes")
    .eq("provider_id", providerId.trim())
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000).toISOString()) // 1 day before
    .lte("scheduled_at", new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000).toISOString()); // 1 day after

  if (existingBookings && existingBookings.length > 0) {
    for (const booking of existingBookings) {
      const bookingStart = new Date(booking.scheduled_at);
      const bookingEnd = new Date(bookingStart.getTime() + (booking.duration_minutes || 60) * 60 * 1000);

      // Check for overlap: (new_start < existing_end AND new_end > existing_start)
      if (scheduledAt < bookingEnd && scheduledEnd > bookingStart) {
        // Find alternative time slots (next 3 available)
        const alternatives: string[] = [];
        // Simple approach: suggest next few hours
        for (let i = 1; i <= 3; i++) {
          const altTime = new Date(scheduledAt.getTime() + i * 60 * 60 * 1000);
          const altTimeStr = altTime.toISOString().split('T')[1].substring(0, 5);
          alternatives.push(altTimeStr);
        }

        return NextResponse.json(
          {
            error: "Time slot not available",
            conflicts: [{
              type: "booking",
              start: bookingStart.toISOString().split('T')[1].substring(0, 5),
              end: bookingEnd.toISOString().split('T')[1].substring(0, 5),
            }],
            alternatives,
          },
          { status: 409 }
        );
      }
    }
  }
  } // End skipAvailabilityCheck

  // === END CONFLICT CHECKING ===

  // If careRequestId is provided, get the patient_id from the care request
  let resolvedPatientId = patientId ?? DEMO_PATIENT_ID;
  if (careRequestId?.trim()) {
    const { data: careRequest } = await supabase
      .from("care_requests")
      .select("patient_id")
      .eq("id", careRequestId.trim())
      .single();

    if (careRequest?.patient_id) {
      resolvedPatientId = careRequest.patient_id;
    }
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

    // Don't update care_request status here - it should remain "open"
    // until the provider confirms the booking
    // The status will be updated when the booking status changes to "confirmed"

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

/** GET list of bookings: patient (default) or provider (?for=provider&date=YYYY-MM-DD). */
export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const forParam = request.nextUrl.searchParams.get("for");
  const dateParam = request.nextUrl.searchParams.get("date");
  const isProvider = forParam === "provider";

  // Parse date filter if provided
  let dateFilter: string | null = null;
  if (dateParam) {
    if (dateParam === "today") {
      dateFilter = new Date().toISOString().split('T')[0];
    } else {
      dateFilter = dateParam; // Assume YYYY-MM-DD format
    }
  }

  if (isProvider) {
    const providerId = accessToken ? await getProviderIdForUser(accessToken) : null;
    if (!providerId) {
      return NextResponse.json({ bookings: [] });
    }

    let query = supabase
      .from("bookings")
      .select(`
        id,
        service,
        scheduled_at,
        status,
        patient_name,
        patient_phone,
        address_notes,
        patients:patient_id (
          name,
          email
        )
      `)
      .eq("provider_id", providerId);

    // Apply date filter if provided
    if (dateFilter) {
      const startOfDay = `${dateFilter}T00:00:00Z`;
      const endOfDay = `${dateFilter}T23:59:59Z`;
      query = query.gte("scheduled_at", startOfDay).lte("scheduled_at", endOfDay);
    }

    const { data: rows, error } = await query.order("scheduled_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Merge patient name from booking and patients table
    const bookings = (rows ?? []).map((row: any) => ({
      ...row,
      patient_name: row.patient_name || row.patients?.name || "Patient",
      patients: undefined, // Remove the joined data from response
    }));

    return NextResponse.json({ bookings });
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
      decline_reason,
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
