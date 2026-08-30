import { prisma } from "@/lib/db";
import { validateRuntimeConfiguration } from "@/modules/security/runtime";
import { logEvent } from "@/lib/logger";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configuration = validateRuntimeConfiguration();
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }
  const ready = configuration.ok && database;
  if (!ready) logEvent("warn", "readiness.failed", { requestId: request.headers.get("x-request-id"), configuration: configuration.ok, database });
  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "crm-tupiniquim",
      checks: { configuration: configuration.ok, database },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", "X-Request-Id": request.headers.get("x-request-id") || randomUUID() } },
  );
}
