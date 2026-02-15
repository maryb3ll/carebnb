import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/providers/[id]/slots?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&duration=60
 * Calculate available time slots for a provider within a date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;
    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");
    const duration = parseInt(searchParams.get("duration") || "60");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "Missing required parameters: from_date, to_date" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "to_date must be after from_date" },
        { status: 400 }
      );
    }

    // Limit range to prevent excessive queries (max 30 days)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return NextResponse.json(
        { error: "Date range cannot exceed 30 days" },
        { status: 400 }
      );
    }

    // 1. Fetch provider's recurring schedule
    const { data: recurringSchedule, error: scheduleError } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("availability_type", "recurring");

    if (scheduleError) {
      console.error("Error fetching recurring schedule:", scheduleError);
      return NextResponse.json(
        { error: "Failed to fetch provider schedule" },
        { status: 500 }
      );
    }

    // 2. Fetch one-time availability/blocks for the date range
    const { data: oneTimeEntries, error: oneTimeError } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .in("availability_type", ["one_time_available", "one_time_blocked"])
      .gte("specific_date", fromDate)
      .lte("specific_date", toDate);

    if (oneTimeError) {
      console.error("Error fetching one-time entries:", oneTimeError);
      return NextResponse.json(
        { error: "Failed to fetch provider blocks" },
        { status: 500 }
      );
    }

    // 3. Fetch existing bookings for the date range
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("scheduled_at, duration_minutes")
      .eq("provider_id", providerId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", `${fromDate}T00:00:00Z`)
      .lte("scheduled_at", `${toDate}T23:59:59Z`);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch existing bookings" },
        { status: 500 }
      );
    }

    // 4. Generate available slots for each date
    const availableSlots: Record<string, string[]> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Check for one-time overrides on this date
      const oneTimeForDate = oneTimeEntries?.filter((e) => e.specific_date === dateStr) || [];
      const blockedEntries = oneTimeForDate.filter((e) => !e.is_available);
      const availableOverride = oneTimeForDate.find(
        (e) => e.is_available && e.availability_type === "one_time_available"
      );

      // Determine working hours for this date
      let workingHours: Array<{ start: string; end: string }> = [];

      if (availableOverride) {
        // One-time override takes precedence
        workingHours = [
          {
            start: availableOverride.start_time,
            end: availableOverride.end_time,
          },
        ];
      } else {
        // Use recurring schedule
        const recurringForDay = recurringSchedule?.filter((s) => s.day_of_week === dayOfWeek) || [];
        workingHours = recurringForDay.map((s) => ({
          start: s.start_time,
          end: s.end_time,
        }));
      }

      // Generate slots for this date
      const slotsForDate: string[] = [];

      for (const hours of workingHours) {
        const [startHour, startMin] = hours.start.split(":").map(Number);
        const [endHour, endMin] = hours.end.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Generate hourly slots (60-minute intervals per user preference)
        for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
          const slotHour = Math.floor(minutes / 60);
          const slotMin = minutes % 60;
          const slotTime = `${slotHour.toString().padStart(2, "0")}:${slotMin.toString().padStart(2, "0")}`;

          // Create slot start and end times in local time (no Z suffix)
          const slotStart = new Date(`${dateStr}T${slotTime}:00`);
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

          // Skip if slot is in the past
          if (slotStart < new Date()) {
            continue;
          }

          // Check if slot overlaps with blocked times
          let isBlocked = false;
          for (const block of blockedEntries) {
            const blockStart = new Date(`${dateStr}T${block.start_time}:00`);
            const blockEnd = new Date(`${dateStr}T${block.end_time}:00`);

            if (slotStart < blockEnd && slotEnd > blockStart) {
              isBlocked = true;
              break;
            }
          }

          if (isBlocked) {
            continue;
          }

          // Check if slot overlaps with existing bookings
          let hasConflict = false;
          for (const booking of bookings || []) {
            const bookingStart = new Date(booking.scheduled_at);
            const bookingEnd = new Date(bookingStart.getTime() + (booking.duration_minutes || 60) * 60 * 1000);

            // Check for overlap: (slotStart < bookingEnd AND slotEnd > bookingStart)
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            slotsForDate.push(slotTime);
          }
        }
      }

      // Only include dates that have available slots
      if (slotsForDate.length > 0) {
        availableSlots[dateStr] = slotsForDate;
      }

      // Move to next date
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      available_slots: availableSlots,
      provider_id: providerId,
      from_date: fromDate,
      to_date: toDate,
      duration_minutes: duration,
    });
  } catch (err) {
    console.error("Slots calculation error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
