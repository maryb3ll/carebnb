import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Client for browser; session stored in localStorage. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server/API client. Pass access token to run requests as that user.
 * Use in API routes: const supabase = createServerSupabase(req.headers.get("authorization")?.replace("Bearer ", ""));
 */
export function createServerSupabase(accessToken: string | null | undefined): SupabaseClient {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
  return client;
}
