import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.organizationId || !["OWNER", "ADMIN", "MANAGER"].includes(String(session.role))) {
    return Response.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const organizationId = session.organizationId;
  const started = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const [failedAutomations, failedWebhooks, pendingApprovals, overduePrivacyRequests, highIncidents] = await Promise.all([
    prisma.automationRun.count({ where: { organizationId, status: "FAILED" } }),
    prisma.webhookDelivery.count({ where: { organizationId, status: "FAILED" } }),
    prisma.outboundApproval.count({ where: { organizationId, status: "PENDING" } }),
    prisma.privacyRequest.count({ where: { organizationId, status: { in: ["RECEIVED", "IDENTITY_VERIFICATION", "IN_PROGRESS"] }, dueAt: { lt: new Date() } } }),
    prisma.securityIncident.count({ where: { organizationId, severity: { in: ["HIGH", "CRITICAL"] }, status: { not: "CLOSED" } } }),
  ]);
  return Response.json({
    status: highIncidents || failedAutomations || failedWebhooks || overduePrivacyRequests ? "attention" : "ok",
    databaseLatencyMs: Number((performance.now() - started).toFixed(2)),
    counters: { failedAutomations, failedWebhooks, pendingApprovals, overduePrivacyRequests, highIncidents },
    timestamp: new Date().toISOString(),
  }, { headers: { "Cache-Control": "no-store" } });
}
