import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * WIPE all of Bryan's bookings, pending requests, and visits
 * This gives him a completely clean slate
 */
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // Get Bryan's provider by name (he doesn't have a user account)
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, name")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Bryan not found", details: providerError?.message },
        { status: 404 }
      );
    }

    results.push({
      action: "Found provider",
      provider: {
        id: provider.id,
        name: provider.name,
      },
    });

    // 1. Get all bookings for Bryan (to know which care_requests to update)
    const { data: allBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, care_request_id, status")
      .eq("provider_id", provider.id);

    if (fetchError) {
      results.push({
        action: "Fetch bookings",
        error: fetchError.message,
      });
    } else {
      results.push({
        action: "Found bookings",
        count: allBookings?.length || 0,
        by_status: allBookings?.reduce((acc: any, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {}),
      });
    }

    // 2. Collect care_request IDs that need to be reset
    const careRequestIds = allBookings
      ?.filter((b) => b.care_request_id)
      .map((b) => b.care_request_id);

    // 3. DELETE all bookings for Bryan
    const { data: deletedBookings, error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("provider_id", provider.id)
      .select("id");

    if (deleteError) {
      results.push({
        action: "Delete bookings",
        error: deleteError.message,
      });
    } else {
      results.push({
        action: "Delete all Bryan's bookings",
        deleted: deletedBookings?.length || 0,
        ids: deletedBookings?.map((b) => b.id),
      });
    }

    // 4. Reset care_requests back to "open" so they can be re-matched
    if (careRequestIds && careRequestIds.length > 0) {
      const uniqueRequestIds = [...new Set(careRequestIds)];

      const { data: updatedRequests, error: updateError } = await supabase
        .from("care_requests")
        .update({
          status: "open",
          updated_at: new Date().toISOString(),
        })
        .in("id", uniqueRequestIds)
        .select("id");

      if (updateError) {
        results.push({
          action: "Reset care_requests to open",
          error: updateError.message,
        });
      } else {
        results.push({
          action: "Reset care_requests to open",
          updated: updatedRequests?.length || 0,
          note: "These care_requests are now available for other providers",
        });
      }
    }

    // 5. Verify cleanup
    const { data: remainingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("provider_id", provider.id);

    results.push({
      action: "Verification",
      remaining_bookings: remainingBookings?.length || 0,
      success: (remainingBookings?.length || 0) === 0,
    });

    return NextResponse.json({
      success: true,
      message: "Bryan's schedule has been wiped clean",
      results,
    });
  } catch (error) {
    console.error("Wipe error:", error);
    return NextResponse.json(
      {
        error: "Wipe failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Preview what would be deleted
 */
export async function GET(request: NextRequest) {
  try {
    // Get Bryan's provider by name
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Bryan not found" }, { status: 404 });
    }

    // Get all bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, status, scheduled_at, care_request_id")
      .eq("provider_id", provider.id);

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
      },
      will_delete: {
        total_bookings: bookings?.length || 0,
        by_status: bookings?.reduce((acc: any, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {}),
        bookings: bookings,
      },
      note: "POST to this endpoint to delete all these bookings",
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
