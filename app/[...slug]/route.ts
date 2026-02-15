import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Serves the React SPA (front end build) for all non-API routes with at least one segment.
 * Root "/" is handled by app/page.tsx (home). The SPA lives at public/spa/ (base: "/spa/").
 */
export function GET() {
  try {
    const htmlPath = join(process.cwd(), "public", "spa", "index.html");
    const html = readFileSync(htmlPath, "utf-8");
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (e) {
    console.error("SPA index not found. Build the front end: cd 'front end' && npm run build", e);
    return new NextResponse(
      "<!DOCTYPE html><html><body><h1>Front end not built</h1><p>Run: cd \"front end\" && npm run build</p></body></html>",
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }
}
