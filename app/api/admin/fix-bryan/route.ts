import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Diagnostic and cleanup endpoint specifically for Bryan Drucker
 */
export async function GET(request: NextRequest) {
  try {
    // Get Bryan's provider ID
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, email")
      .eq("email", "bryan.drucker@carebnb.demo")
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Bryan not found" }, { status: 404 });
    }

    // Get all care_requests that would show in pending requests for Bryan
    const { data: pendingRequests } = await supabase
      .rpc("match_requests", {
        p_service: "nursing",
        p_lat: 37.44,
        p_lng: -122.17,
        p_radius_km: 50,
        p_limit_n: 20,
      });

    // Get all bookings for Bryan
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false });

    // Get all care_requests (regardless of status)
    const { data: allCareRequests } = await supabase
      .from("care_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Find bookings for today
    const today = new Date().toISOString().split("T")[0];
    const todaysBookings = allBookings?.filter((b) => {
      const bookingDate = new Date(b.scheduled_at).toISOString().split("T")[0];
      return bookingDate === today;
    });

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email,
      },
      pending_requests_showing: pendingRequests?.length || 0,
      pending_requests: pendingRequests,
      total_bookings: allBookings?.length || 0,
      bookings_by_status: allBookings?.reduce((acc: any, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}),
      todays_bookings_count: todaysBookings?.length || 0,
      todays_bookings: todaysBookings,
      care_requests_by_status: allCareRequests?.reduce((acc: any, cr) => {
        acc[cr.status] = (acc[cr.status] || 0) + 1;
        return acc;
      }, {}),
      recent_care_requests: allCareRequests?.slice(0, 5),
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: Aggressive cleanup for Bryan
 */
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // Get Bryan's provider ID
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("email", "bryan.drucker@carebnb.demo")
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Bryan not found" }, { status: 404 });
    }

    // 1. Mark ALL open care_requests that have bookings for Bryan as declined
    const { data: openRequests } = await supabase
      .from("care_requests")
      .select(`
        id,
        status,
        bookings!inner (
          id,
          status,
          provider_id
        )
      `)
      .eq("status", "open")
      .eq("bookings.provider_id", provider.id);

    if (openRequests && openRequests.length > 0) {
      const requestIds = openRequests.map((r) => r.id);

      const { data: updated, error: updateError } = await supabase
        .from("care_requests")
        .update({
          status: "declined",
          updated_at: new Date().toISOString(),
        })
        .in("id", requestIds)
        .select("id");

      results.push({
        action: "Mark open care_requests with Bryan's bookings as declined",
        found: requestIds.length,
        updated: updated?.length || 0,
        error: updateError?.message,
      });
    } else {
      results.push({
        action: "Mark open care_requests with Bryan's bookings as declined",
        found: 0,
        note: "No open care_requests found with Bryan's bookings",
      });
    }

    // 2. Delete any pending bookings that don't have care_request_id
    const { data: orphanedBookings, error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("provider_id", provider.id)
      .eq("status", "pending")
      .is("care_request_id", null)
      .select("id");

    results.push({
      action: "Delete orphaned pending bookings (no care_request_id)",
      deleted: orphanedBookings?.length || 0,
      error: deleteError?.message,
    });

    // 3. Get final state
    const { data: finalBookings } = await supabase
      .from("bookings")
      .select("status")
      .eq("provider_id", provider.id);

    const { data: finalRequests } = await supabase
      .from("care_requests")
      .select("status");

    results.push({
      action: "Final state",
      bryans_bookings_by_status: finalBookings?.reduce((acc: any, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}),
      care_requests_by_status: finalRequests?.reduce((acc: any, cr) => {
        acc[cr.status] = (acc[cr.status] || 0) + 1;
        return acc;
      }, {}),
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
