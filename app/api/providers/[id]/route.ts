import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
  }
  const { data: provider, error } = await supabase
    .from("providers")
    .select("id, name, role, services, specialties, rating, visit_count, price, next_available, photo_url")
    .eq("id", id)
    .single();
  if (error || !provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }
  return NextResponse.json(provider);
}
