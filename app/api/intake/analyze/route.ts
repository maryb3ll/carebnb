import { NextRequest, NextResponse } from "next/server";
import { addIntakeActivity } from "@/lib/intakeActivityLog";

// Default 5001: macOS AirPlay uses 5000 and returns 403
const PIPELINE_URL = process.env.PIPELINE_API_URL || "http://localhost:5001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const type = isJson ? "text" : "audio";
  let upstreamRes: Response;

  try {
    if (isJson) {
      const body = await request.json();
      upstreamRes = await fetch(`${PIPELINE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      upstreamRes = await fetch(`${PIPELINE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
    } else {
      addIntakeActivity({ type, status: "error", error: "Invalid content-type" });
      return NextResponse.json(
        { error: "Send JSON { text } or multipart with 'audio' file", status: "failed" },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Pipeline request failed";
    addIntakeActivity({ type, status: "unavailable", error: message });
    return NextResponse.json(
      { error: `Intake service unavailable: ${message}. Is the pipeline server running? (cd audio-model && python server.py)`, status: "failed" },
      { status: 503, headers: corsHeaders }
    );
  }

  const data = await upstreamRes.json().catch(() => ({}));
  if (upstreamRes.ok) {
    addIntakeActivity({
      type,
      status: "success",
      sessionId: data.sessionId,
    });
  } else {
    addIntakeActivity({
      type,
      status: "error",
      error: data?.error || `HTTP ${upstreamRes.status}`,
    });
  }

  const status = upstreamRes.ok ? 200 : upstreamRes.status;
  if (status === 403) {
    const message =
      data?.error ||
      "Access forbidden (403). On macOS, port 5000 is often AirPlay—pipeline uses 5001. Run: cd audio-model && python server.py (listens on 5001). Or set PIPELINE_API_URL.";
    return NextResponse.json(
      { ...data, error: message, status: "failed" },
      { status: 403, headers: corsHeaders }
    );
  }
  return NextResponse.json(data, { status, headers: corsHeaders });
}
