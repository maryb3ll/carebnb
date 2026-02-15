import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProviderIdForUser } from "@/lib/auth";

/**
 * GET /api/providers/[id]/availability
 * Fetch a provider's availability schedule and blocks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Fetch all availability entries for this provider
    const { data: availability, error } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .order("specific_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching availability:", error);
      return NextResponse.json(
        { error: "Failed to fetch availability", details: error.message },
        { status: 500 }
      );
    }

    // Separate recurring schedule and one-time entries
    const recurring = availability?.filter((a) => a.availability_type === "recurring") || [];
    const oneTime = availability?.filter((a) =>
      a.availability_type === "one_time_available" || a.availability_type === "one_time_blocked"
    ) || [];

    return NextResponse.json({
      recurring,
      one_time: oneTime,
    });
  } catch (err) {
    console.error("Availability GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers/[id]/availability
 * Add a new availability entry (recurring schedule or one-time block)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    // Authenticate the user
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedProviderId = await getProviderIdForUser(accessToken);

    // Ensure the authenticated provider matches the requested provider
    if (authenticatedProviderId !== providerId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only modify your own availability" },
        { status: 403 }
      );
    }

    // Parse request body
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
      availability_type,
      day_of_week,
      specific_date,
      start_time,
      end_time,
      is_available,
      notes,
    } = body as {
      availability_type?: string;
      day_of_week?: number;
      specific_date?: string;
      start_time?: string;
      end_time?: string;
      is_available?: boolean;
      notes?: string;
    };

    // Validate required fields
    if (!availability_type || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields: availability_type, start_time, end_time" },
        { status: 400 }
      );
    }

    // Validate availability_type
    const validTypes = ["recurring", "one_time_available", "one_time_blocked"];
    if (!validTypes.includes(availability_type)) {
      return NextResponse.json(
        { error: `Invalid availability_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate recurring vs one-time fields
    if (availability_type === "recurring") {
      if (day_of_week === undefined || day_of_week === null) {
        return NextResponse.json(
          { error: "day_of_week is required for recurring availability" },
          { status: 400 }
        );
      }
      if (day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)" },
          { status: 400 }
        );
      }
    } else {
      if (!specific_date) {
        return NextResponse.json(
          { error: "specific_date is required for one-time availability" },
          { status: 400 }
        );
      }
    }

    // Build insert object
    const insertData: any = {
      provider_id: providerId,
      availability_type,
      start_time,
      end_time,
      is_available: is_available ?? true,
      notes: notes || null,
    };

    if (availability_type === "recurring") {
      insertData.day_of_week = day_of_week;
      insertData.specific_date = null;
    } else {
      insertData.specific_date = specific_date;
      insertData.day_of_week = null;
    }

    // Insert into database
    const { data: newEntry, error: insertError } = await supabase
      .from("provider_availability")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting availability:", insertError);
      return NextResponse.json(
        { error: "Failed to create availability entry", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      availability: newEntry,
    });
  } catch (err) {
    console.error("Availability POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/providers/[id]/availability?entryId=<uuid>
 * Delete a specific availability entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const providerId = params.id;

    // Authenticate the user
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedProviderId = await getProviderIdForUser(accessToken);

    // Ensure the authenticated provider matches the requested provider
    if (authenticatedProviderId !== providerId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only modify your own availability" },
        { status: 403 }
      );
    }

    // Get entryId from query params
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");

    if (!entryId) {
      return NextResponse.json(
        { error: "Missing required query parameter: entryId" },
        { status: 400 }
      );
    }

    // Delete the entry (verify it belongs to this provider)
    const { data: deleted, error: deleteError } = await supabase
      .from("provider_availability")
      .delete()
      .eq("id", entryId)
      .eq("provider_id", providerId)
      .select();

    if (deleteError) {
      console.error("Error deleting availability:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete availability entry", details: deleteError.message },
        { status: 500 }
      );
    }

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Availability entry not found or does not belong to this provider" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: deleted[0],
    });
  } catch (err) {
    console.error("Availability DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
