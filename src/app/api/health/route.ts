import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", service: "crm-tupiniquim", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", "X-Request-Id": randomUUID() } });
}
