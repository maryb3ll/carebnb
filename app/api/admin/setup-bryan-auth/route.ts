import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Create a user account for Bryan Drucker and link it to his provider record
 */
export async function POST(request: NextRequest) {
  try {
    const email = "bryan.drucker@carebnb.demo";
    const password = "password123"; // Simple password for demo

    // 1. Find Bryan's provider record
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, name, user_id")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Bryan's provider record not found" },
        { status: 404 }
      );
    }

    // 2. Check if he already has a user account
    if (provider.user_id) {
      return NextResponse.json({
        success: true,
        message: "Bryan already has a user account",
        provider_id: provider.id,
        user_id: provider.user_id,
        email: email,
        note: "Try logging in with bryan.drucker@carebnb.demo / password123",
      });
    }

    // 3. Create user account in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: provider.name,
        role: "provider",
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: "Failed to create user", details: authError.message },
        { status: 500 }
      );
    }

    // 4. Link the user to the provider record
    const { error: updateError } = await supabase
      .from("providers")
      .update({
        user_id: authData.user.id,
      })
      .eq("id", provider.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to link user to provider", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bryan's user account has been created!",
      credentials: {
        email: email,
        password: password,
      },
      provider_id: provider.id,
      user_id: authData.user.id,
      note: "You can now login with these credentials",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET: Check if Bryan has a user account
 */
export async function GET(request: NextRequest) {
  try {
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, user_id")
      .ilike("name", "%Bryan Drucker%")
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Bryan not found" }, { status: 404 });
    }

    return NextResponse.json({
      provider_id: provider.id,
      name: provider.name,
      has_user_account: !!provider.user_id,
      user_id: provider.user_id,
      note: provider.user_id
        ? "Bryan has a user account"
        : "POST to this endpoint to create a user account for Bryan",
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
