import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Check if Bryan's provider record is properly linked to his user account
 */
export async function GET(request: NextRequest) {
  try {
    // Get Bryan's provider record
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, name, user_id")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Bryan's provider record not found", details: providerError?.message },
        { status: 404 }
      );
    }

    // Try to find user by email
    const email = "bryan.drucker@carebnb.demo";
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.find(u => u.email === email);

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
        user_id: provider.user_id,
        is_linked: !!provider.user_id,
      },
      auth_user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      } : null,
      match: provider.user_id === user?.id,
      issue: provider.user_id !== user?.id ? "Provider record not linked to auth user" : null,
    });
  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST: Fix the link between Bryan's provider and auth account
 */
export async function POST(request: NextRequest) {
  try {
    const email = "bryan.drucker@carebnb.demo";

    // Get Bryan's provider record
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Bryan not found" }, { status: 404 });
    }

    // Get user by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "Auth user not found" }, { status: 404 });
    }

    // Link provider to user
    const { error: updateError } = await supabase
      .from("providers")
      .update({ user_id: user.id })
      .eq("id", provider.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to link", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bryan's provider record linked to auth account",
      provider_id: provider.id,
      user_id: user.id,
    });
  } catch (error) {
    console.error("Fix error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
