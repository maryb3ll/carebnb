import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get all care_requests with their bookings
    const { data: careRequests, error } = await supabase
      .from("care_requests")
      .select(`
        id,
        service,
        status,
        description,
        requested_start,
        created_at,
        updated_at,
        bookings (
          id,
          status,
          provider_id,
          decline_reason
        )
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by status
    const byStatus: Record<string, any[]> = {};
    careRequests?.forEach((cr) => {
      const status = cr.status || "unknown";
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(cr);
    });

    return NextResponse.json({
      totalCareRequests: careRequests?.length || 0,
      byStatus,
      recentCareRequests: careRequests?.slice(0, 10), // Show 10 most recent
      allCareRequests: careRequests,
    });
  } catch (err) {
    console.error("Debug endpoint error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
