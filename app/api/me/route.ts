import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getPatientIdForUser, getProviderIdForUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const user = await getAuthUser(accessToken);
  if (!user) {
    return NextResponse.json({ user: null, patientId: null, providerId: null });
  }
  const [patientId, providerId] = await Promise.all([
    getPatientIdForUser(accessToken),
    getProviderIdForUser(accessToken),
  ]);
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    patientId: patientId ?? null,
    providerId: providerId ?? null,
  });
}
