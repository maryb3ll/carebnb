import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Create user accounts for ALL providers that don't have one
 * Email format: firstname.lastname@carebnb.demo
 * Password: password123
 */
export async function POST(request: NextRequest) {
  try {
    const results: any[] = [];

    // 1. Get all providers
    const { data: providers, error: fetchError } = await supabase
      .from("providers")
      .select("id, name, user_id");

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch providers", details: fetchError.message },
        { status: 500 }
      );
    }

    results.push({
      action: "Fetch providers",
      total_providers: providers?.length || 0,
      providers_without_auth: providers?.filter(p => !p.user_id).length || 0,
    });

    // 2. Create user accounts for providers without one
    for (const provider of providers || []) {
      if (provider.user_id) {
        // Already has a user account, skip
        continue;
      }

      // Generate email from name: "Bryan Drucker MD" -> "bryan.drucker@carebnb.demo"
      const nameParts = provider.name
        .replace(/ MD$/i, '')
        .replace(/ DO$/i, '')
        .replace(/ NP$/i, '')
        .replace(/ PA$/i, '')
        .trim()
        .toLowerCase()
        .split(' ');

      const email = nameParts.length >= 2
        ? `${nameParts[0]}.${nameParts[1]}@carebnb.demo`
        : `${nameParts[0]}@carebnb.demo`;

      const password = "password123";

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        let userId: string;

        if (existingUser) {
          // User exists, just link it
          userId = existingUser.id;
          results.push({
            action: "Link existing user",
            provider_id: provider.id,
            provider_name: provider.name,
            email: email,
            user_id: userId,
          });
        } else {
          // Create new user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              name: provider.name,
              role: "provider",
            },
          });

          if (authError) {
            results.push({
              action: "Create user FAILED",
              provider_id: provider.id,
              provider_name: provider.name,
              email: email,
              error: authError.message,
            });
            continue;
          }

          userId = authData.user.id;

          results.push({
            action: "Create user",
            provider_id: provider.id,
            provider_name: provider.name,
            email: email,
            password: password,
            user_id: userId,
          });
        }

        // Link user to provider
        const { error: updateError } = await supabase
          .from("providers")
          .update({ user_id: userId })
          .eq("id", provider.id);

        if (updateError) {
          results.push({
            action: "Link user to provider FAILED",
            provider_id: provider.id,
            error: updateError.message,
          });
        }

      } catch (error) {
        results.push({
          action: "Error processing provider",
          provider_id: provider.id,
          provider_name: provider.name,
          error: String(error),
        });
      }
    }

    // 3. Summary
    const { data: finalProviders } = await supabase
      .from("providers")
      .select("id, name, user_id");

    const providersWithAuth = finalProviders?.filter(p => p.user_id).length || 0;
    const providersWithoutAuth = finalProviders?.filter(p => !p.user_id).length || 0;

    return NextResponse.json({
      success: true,
      message: "Provider authentication setup complete",
      summary: {
        total_providers: finalProviders?.length || 0,
        with_auth: providersWithAuth,
        without_auth: providersWithoutAuth,
      },
      results,
      default_credentials: {
        password: "password123",
        note: "All providers use this password. Email format: firstname.lastname@carebnb.demo",
      },
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
 * GET: Check current auth setup status
 */
export async function GET(request: NextRequest) {
  try {
    const { data: providers } = await supabase
      .from("providers")
      .select("id, name, user_id");

    const providersWithAuth = providers?.filter(p => p.user_id) || [];
    const providersWithoutAuth = providers?.filter(p => !p.user_id) || [];

    return NextResponse.json({
      total_providers: providers?.length || 0,
      with_auth: providersWithAuth.length,
      without_auth: providersWithoutAuth.length,
      providers_needing_auth: providersWithoutAuth.map(p => ({
        id: p.id,
        name: p.name,
        suggested_email: p.name
          .replace(/ MD$/i, '')
          .replace(/ DO$/i, '')
          .replace(/ NP$/i, '')
          .replace(/ PA$/i, '')
          .trim()
          .toLowerCase()
          .split(' ')
          .slice(0, 2)
          .join('.') + '@carebnb.demo',
      })),
      note: "POST to this endpoint to create auth accounts for all providers",
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
