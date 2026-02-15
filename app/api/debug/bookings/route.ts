import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProviderIdForUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();

    const providerId = accessToken
      ? await getProviderIdForUser(accessToken)
      : null;

    console.log("Debug - Provider ID:", providerId);

    if (!providerId) {
      return NextResponse.json({ error: "No provider ID found" }, { status: 401 });
    }

    // Get all bookings for this provider
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by status
    const byStatus: Record<string, any[]> = {};
    bookings?.forEach((b) => {
      const status = b.status || "unknown";
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(b);
    });

    return NextResponse.json({
      providerId,
      totalBookings: bookings?.length || 0,
      byStatus,
      allBookings: bookings,
    });
  } catch (err) {
    console.error("Debug bookings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
