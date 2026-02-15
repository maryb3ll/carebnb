import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Check all care_requests to see what's causing pending requests to show up
 */
export async function GET(request: NextRequest) {
  try {
    // Get all care_requests
    const { data: careRequests, error: careError } = await supabase
      .from("care_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (careError) {
      return NextResponse.json({ error: careError.message }, { status: 500 });
    }

    // Group by status
    const byStatus = (careRequests || []).reduce((acc: any, cr) => {
      acc[cr.status] = (acc[cr.status] || 0) + 1;
      return acc;
    }, {});

    // Get all bookings
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // Group bookings by status
    const bookingsByStatus = (bookings || []).reduce((acc: any, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    // Find open care_requests
    const openRequests = careRequests?.filter(cr => cr.status === "open") || [];

    return NextResponse.json({
      care_requests: {
        total: careRequests?.length || 0,
        by_status: byStatus,
        open_count: openRequests.length,
        open_requests: openRequests,
      },
      bookings: {
        total: bookings?.length || 0,
        by_status: bookingsByStatus,
      },
    });
  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST: Clean up orphaned/duplicate care_requests
 */
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // Get all open care_requests
    const { data: openRequests } = await supabase
      .from("care_requests")
      .select("*")
      .eq("status", "open");

    results.push({
      action: "Found open care_requests",
      count: openRequests?.length || 0,
    });

    // For each open care_request, check if it has bookings
    for (const request of openRequests || []) {
      const { data: requestBookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("care_request_id", request.id);

      // If it has confirmed bookings, mark as matched
      const hasConfirmed = requestBookings?.some(b => b.status === "confirmed");
      if (hasConfirmed) {
        const { error: updateError } = await supabase
          .from("care_requests")
          .update({ status: "matched", updated_at: new Date().toISOString() })
          .eq("id", request.id);

        results.push({
          action: "Mark as matched (has confirmed booking)",
          care_request_id: request.id,
          error: updateError?.message,
        });
      }
    }

    // Get final state
    const { data: finalRequests } = await supabase
      .from("care_requests")
      .select("status");

    const finalByStatus = (finalRequests || []).reduce((acc: any, cr) => {
      acc[cr.status] = (acc[cr.status] || 0) + 1;
      return acc;
    }, {});

    results.push({
      action: "Final state",
      care_requests_by_status: finalByStatus,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
