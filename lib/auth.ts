import { supabase, createServerSupabase } from "@/lib/supabase";

const DEMO_PATIENT_ID = "a0000000-0000-0000-0000-000000000001";

export async function getPatientIdForUser(accessToken: string | null | undefined): Promise<string | null> {
  if (!accessToken?.trim()) return null;
  const client = createServerSupabase(accessToken);
  const { data: { user } } = await client.auth.getUser();
  if (!user?.id) return null;
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created, error } = await supabase
    .from("patients")
    .insert({
      name: user.email?.split("@")[0] ?? "User",
      email: user.email ?? undefined,
      user_id: user.id,
    })
    .select("id")
    .single();
  if (error || !created?.id) return null;
  return created.id;
}

export async function getProviderIdForUser(accessToken: string | null | undefined): Promise<string | null> {
  if (!accessToken?.trim()) return null;
  const client = createServerSupabase(accessToken);
  const { data: { user } } = await client.auth.getUser();
  if (!user?.id) return null;
  const { data: row } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return row?.id ?? null;
}

export async function getAuthUser(accessToken: string | null | undefined): Promise<{ id: string; email?: string } | null> {
  if (!accessToken?.trim()) return null;
  const client = createServerSupabase(accessToken);
  const { data: { user } } = await client.auth.getUser();
  return user ? { id: user.id, email: user.email ?? undefined } : null;
}

export { DEMO_PATIENT_ID };
