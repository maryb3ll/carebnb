import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

/**
 * Verify Bryan can authenticate and check if getProviderIdForUser works
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Try to login
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const testClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: "Login failed", details: authError.message },
        { status: 401 }
      );
    }

    const accessToken = authData.session?.access_token;
    const userId = authData.user?.id;

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "No session created" }, { status: 500 });
    }

    // Now check if we can find the provider
    const { supabase } = await import("@/lib/supabase");
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, user_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Also test the getProviderIdForUser function
    const { getProviderIdForUser } = await import("@/lib/auth");
    const providerId = await getProviderIdForUser(accessToken);

    return NextResponse.json({
      success: true,
      auth_user: {
        id: userId,
        email: authData.user?.email,
      },
      provider_lookup: provider ? {
        id: provider.id,
        name: provider.name,
        user_id: provider.user_id,
      } : null,
      get_provider_id_result: providerId,
      will_redirect_work: !!providerId,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
