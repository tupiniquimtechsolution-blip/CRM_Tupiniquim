import type { Prisma } from "@/generated/prisma/client";
import { dispatchAutomationEvent } from "@/modules/automations/service";
import { stableKey } from "@/modules/automations/domain";
import { authenticateWebhook } from "@/modules/integrations/service";
import { prisma } from "@/lib/db";
import { consumeRateLimit, requestFingerprint } from "@/modules/security/rate-limit";

const maxPayloadBytes = 256 * 1024;

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const rateLimit = await consumeRateLimit({ scope: `webhook:${publicId}`, identifier: requestFingerprint(request), limit: 120, windowMs: 60_000 });
  if (!rateLimit.allowed) return Response.json({ error: "Limite temporário excedido." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const endpoint = await authenticateWebhook(publicId, token);
  if (!endpoint) return Response.json({ error: "Webhook não autorizado." }, { status: 401 });
  const eventKey = request.headers.get("idempotency-key")?.trim();
  if (!eventKey || eventKey.length > 200) return Response.json({ error: "Cabeçalho Idempotency-Key obrigatório." }, { status: 400 });
  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > maxPayloadBytes) return Response.json({ error: "Payload excede 256 KB." }, { status: 413 });
  let payload: Prisma.InputJsonValue;
  try {
    payload = JSON.parse(body) as Prisma.InputJsonValue;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }
  let delivery;
  try {
    delivery = await prisma.webhookDelivery.create({ data: { organizationId: endpoint.organizationId, endpointId: endpoint.id, eventKey, payload, status: "PROCESSING", attempts: 1 } });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const previous = await prisma.webhookDelivery.findUnique({ where: { endpointId_eventKey: { endpointId: endpoint.id, eventKey } } });
    return Response.json({ accepted: true, duplicate: true, deliveryId: previous?.id ?? null });
  }
  try {
    const runIds = await dispatchAutomationEvent({ organizationId: endpoint.organizationId, triggerType: "WEBHOOK_RECEIVED", eventKey: stableKey("webhook", endpoint.id, eventKey), payload });
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: "SUCCEEDED", processedAt: new Date() } });
    return Response.json({ accepted: true, duplicate: false, deliveryId: delivery.id, automationRuns: runIds.length }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar webhook.";
    await prisma.webhookDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", error: message, processedAt: new Date() } });
    return Response.json({ error: "Falha ao processar o evento.", deliveryId: delivery.id }, { status: 500 });
  }
}
