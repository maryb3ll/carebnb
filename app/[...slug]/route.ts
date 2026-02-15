import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SPA_DIR = join(process.cwd(), "public", "spa");

const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/**
 * Serves the React SPA (front end build) for all non-API routes with at least one segment.
 * Root "/" is handled by app/page.tsx (home). The SPA lives at public/spa/.
 * Requests for /spa/* are served as static files so JS/CSS load correctly.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const { slug: slugParam } = await context.params;
  const slug = slugParam ?? [];
  // Requests to /spa/assets/... must return the actual file, not the SPA HTML
  if (slug[0] === "spa" && slug.length > 1) {
    const filePath = join(SPA_DIR, ...slug.slice(1));
    if (existsSync(filePath)) {
      try {
        const ext = filePath.slice(filePath.lastIndexOf("."));
        const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
        const body = readFileSync(filePath);
        return new NextResponse(body, {
          headers: { "Content-Type": contentType },
        });
      } catch {
        return new NextResponse(null, { status: 404 });
      }
    }
  }

  try {
    const htmlPath = join(SPA_DIR, "index.html");
    const html = readFileSync(htmlPath, "utf-8");
    // SPA uses /assets/ and /manifest.json; rewrites in next.config serve them from /spa/*
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
