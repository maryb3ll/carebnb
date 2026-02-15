import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Debug endpoint to check care_request status after decline
 */
export async function GET(request: NextRequest) {
  try {
    // Get all care_requests
    const { data: allRequests } = await supabase
      .from("care_requests")
      .select("id, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get all bookings
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id, care_request_id, provider_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    // Group by status
    const requestsByStatus = (allRequests || []).reduce((acc: any, cr) => {
      acc[cr.status] = (acc[cr.status] || 0) + 1;
      return acc;
    }, {});

    const bookingsByStatus = (allBookings || []).reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    // Find declined bookings and check their care_request status
    const declinedBookings = allBookings?.filter(b => b.status === "declined") || [];
    const mismatchedDeclines = [];

    for (const booking of declinedBookings) {
      if (booking.care_request_id) {
        const request = allRequests?.find(r => r.id === booking.care_request_id);
        // For declined bookings, care_request should be 'closed' or 'declined'
        if (request && request.status !== "closed" && request.status !== "declined") {
          mismatchedDeclines.push({
            booking_id: booking.id,
            care_request_id: booking.care_request_id,
            booking_status: booking.status,
            care_request_status: request.status,
            issue: `Booking is declined but care_request is ${request.status} (should be closed)`,
          });
        }
      }
    }

    return NextResponse.json({
      care_requests: {
        total: allRequests?.length || 0,
        by_status: requestsByStatus,
        recent: allRequests?.slice(0, 5).map(r => ({
          id: r.id,
          status: r.status,
          updated_at: r.updated_at,
        })),
      },
      bookings: {
        total: allBookings?.length || 0,
        by_status: bookingsByStatus,
        recent: allBookings?.slice(0, 5).map(b => ({
          id: b.id,
          care_request_id: b.care_request_id,
          status: b.status,
        })),
      },
      mismatched_declines: mismatchedDeclines,
      has_issues: mismatchedDeclines.length > 0,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST: Fix any mismatched declines
 */
export async function POST(request: NextRequest) {
  try {
    // Find all declined bookings
    const { data: declinedBookings } = await supabase
      .from("bookings")
      .select("id, care_request_id, status")
      .eq("status", "declined");

    const results: any[] = [];

    for (const booking of declinedBookings || []) {
      if (booking.care_request_id) {
        // Get the care_request
        const { data: careRequest } = await supabase
          .from("care_requests")
          .select("id, status")
          .eq("id", booking.care_request_id)
          .single();

        if (careRequest && careRequest.status !== "closed") {
          // Fix it - use 'closed' instead of 'declined' (DB constraint limitation)
          const { error: updateError } = await supabase
            .from("care_requests")
            .update({ status: "closed", updated_at: new Date().toISOString() })
            .eq("id", booking.care_request_id);

          results.push({
            care_request_id: booking.care_request_id,
            old_status: careRequest.status,
            new_status: "closed",
            error: updateError?.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixed: results.length,
      results,
    });
  } catch (error) {
    console.error("Fix error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
