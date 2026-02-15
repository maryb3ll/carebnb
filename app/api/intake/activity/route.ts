import { NextResponse } from "next/server";
import { getIntakeActivity } from "@/lib/intakeActivityLog";

export async function GET() {
  const entries = getIntakeActivity(50);
  return NextResponse.json({ entries });
}
