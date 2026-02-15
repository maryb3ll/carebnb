import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Admin endpoint to clean up timezone-related data issues
 * This fixes care_requests that should be declined but are still "open"
 */
export async function POST(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      actions: [],
    };

    // 1. Find care_requests that are "open" but have declined/cancelled bookings
    const { data: orphanedRequests, error: findError } = await supabase
      .from("care_requests")
      .select(`
        id,
        status,
        requested_start,
        bookings!inner (
          id,
          status
        )
      `)
      .eq("status", "open")
      .in("bookings.status", ["declined", "cancelled"]);

    if (findError) {
      console.error("Error finding orphaned requests:", findError);
      results.actions.push({
        action: "find_orphaned_requests",
        error: findError.message,
      });
    } else {
      results.actions.push({
        action: "find_orphaned_requests",
        found: orphanedRequests?.length || 0,
        requests: orphanedRequests,
      });

      // 2. Update these care_requests to "declined"
      if (orphanedRequests && orphanedRequests.length > 0) {
        const requestIds = orphanedRequests.map((r) => r.id);

        const { data: updated, error: updateError } = await supabase
          .from("care_requests")
          .update({
            status: "declined",
            updated_at: new Date().toISOString(),
          })
          .in("id", requestIds)
          .select("id");

        if (updateError) {
          console.error("Error updating care_requests:", updateError);
          results.actions.push({
            action: "update_care_requests",
            error: updateError.message,
          });
        } else {
          results.actions.push({
            action: "update_care_requests",
            updated: updated?.length || 0,
            ids: updated?.map((r) => r.id),
          });
        }
      }
    }

    // 3. Find duplicate bookings for the same care_request
    const { data: duplicates, error: dupError } = await supabase.rpc(
      "find_duplicate_bookings"
    );

    if (dupError && dupError.code !== "42883") {
      // 42883 = function doesn't exist, which is ok
      console.error("Error finding duplicates:", dupError);
      results.actions.push({
        action: "find_duplicates",
        error: dupError.message,
        note: "RPC function may not exist - this is optional",
      });
    }

    // 4. Summary
    const { data: careRequestStats } = await supabase
      .from("care_requests")
      .select("status")
      .then((res) => {
        if (res.error) return { data: null };
        const stats: Record<string, number> = {};
        res.data?.forEach((cr) => {
          stats[cr.status] = (stats[cr.status] || 0) + 1;
        });
        return { data: stats };
      });

    const { data: bookingStats } = await supabase
      .from("bookings")
      .select("status")
      .then((res) => {
        if (res.error) return { data: null };
        const stats: Record<string, number> = {};
        res.data?.forEach((b) => {
          stats[b.status] = (stats[b.status] || 0) + 1;
        });
        return { data: stats };
      });

    results.summary = {
      care_requests_by_status: careRequestStats,
      bookings_by_status: bookingStats,
    };

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        error: "Cleanup failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to preview what would be cleaned up without making changes
 */
export async function GET(request: NextRequest) {
  try {
    // Find care_requests that are "open" but have declined/cancelled bookings
    const { data: orphanedRequests, error } = await supabase
      .from("care_requests")
      .select(`
        id,
        status,
        requested_start,
        description,
        bookings!inner (
          id,
          status,
          provider_id
        )
      `)
      .eq("status", "open")
      .in("bookings.status", ["declined", "cancelled"]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orphaned_care_requests: orphanedRequests?.length || 0,
      details: orphanedRequests,
      note: "These care_requests are 'open' but have declined/cancelled bookings. They should be marked as 'declined'.",
      action: "POST to this endpoint to fix",
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      {
        error: "Preview failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
