import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * No rewrite needed — root "/" is handled by app/page.tsx (landing).
 * Other paths are served by the [[...slug]] SPA catch-all.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
