import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3002";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.join("/")}${request.nextUrl.search}`;
  const res = await fetch(target, { headers: { Accept: "application/json" } });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.join("/")}${request.nextUrl.search}`;
  const body = await request.text();
  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.join("/")}${request.nextUrl.search}`;
  const body = await request.text();
  const res = await fetch(target, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
