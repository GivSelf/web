import { NextResponse } from "next/server";

// Returns the WebSocket URL for the client to connect to
// In Docker, API_URL is internal (http://server:3032) but WS needs the external address
// WS_URL env var allows explicit override; otherwise client falls back to same-origin
export function GET() {
  const wsUrl = process.env.WS_URL || "";
  return NextResponse.json({ wsUrl });
}
