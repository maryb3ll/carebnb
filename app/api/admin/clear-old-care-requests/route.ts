import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Clear all open care_requests to clean up the pending requests list
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

    // Delete all open care_requests
    const { data: deleted, error: deleteError } = await supabase
      .from("care_requests")
      .delete()
      .eq("status", "open")
      .select("id");

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete care_requests", details: deleteError.message },
        { status: 500 }
      );
    }

    results.push({
      action: "Deleted open care_requests",
      deleted: deleted?.length || 0,
      ids: deleted?.map(r => r.id),
    });

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
      message: `Deleted ${deleted?.length || 0} open care_requests`,
      results,
    });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: "Clear failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET: Preview what will be deleted
 */
export async function GET(request: NextRequest) {
  try {
    const { data: openRequests } = await supabase
      .from("care_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      will_delete: openRequests?.length || 0,
      care_requests: openRequests?.map(cr => ({
        id: cr.id,
        patient_id: cr.patient_id,
        service: cr.service,
        requested_start: cr.requested_start,
        created_at: cr.created_at,
        transcript: cr.transcript?.substring(0, 100),
      })),
      note: "POST to this endpoint to delete all these open care_requests",
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
