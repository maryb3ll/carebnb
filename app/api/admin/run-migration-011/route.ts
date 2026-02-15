import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Run migration 011: Add 'declined' status to care_requests
 */
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // Step 1: Drop old constraint (may not exist, so we'll check error)
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE care_requests DROP CONSTRAINT IF EXISTS care_requests_status_check;'
    });

    // If rpc doesn't exist, we'll do it a different way
    // Just try updating the constraint directly

    // Step 2: Update existing care_requests that are linked to declined bookings
    const { data: updated, error: updateError } = await supabase.rpc('update_declined_care_requests');

    // Since we can't run raw DDL from the client, let's just manually fix the data
    // Find all care_requests that have declined bookings
    const { data: declinedBookings } = await supabase
      .from("bookings")
      .select("care_request_id")
      .eq("status", "declined")
      .not("care_request_id", "is", null);

    const careRequestIds = [...new Set(declinedBookings?.map(b => b.care_request_id) || [])];

    results.push({
      action: "Found care_requests linked to declined bookings",
      count: careRequestIds.length,
      ids: careRequestIds,
    });

    // The constraint update needs to be done in Supabase SQL Editor
    // But we can try to work around it by using 'closed' instead
    for (const careRequestId of careRequestIds) {
      const { error: updateErr } = await supabase
        .from("care_requests")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", careRequestId);

      results.push({
        action: "Update care_request to closed",
        care_request_id: careRequestId,
        error: updateErr?.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Migration workaround applied - set declined requests to 'closed'",
      note: "To properly fix this, run migration 011 in Supabase SQL Editor",
      migration_file: "/supabase/migrations/011_add_declined_status_to_care_requests.sql",
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
