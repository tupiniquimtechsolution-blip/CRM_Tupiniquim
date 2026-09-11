import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { assertOutboundPrivacyAllowed } from "@/modules/privacy/communication";
import { integrationAdapter } from "./adapters";

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function listIntegrationWorkspace(actor: TenantActor) {
  assertPermission(actor, "automation:read");
  return Promise.all([
    prisma.integrationConnection.findMany({ where: tenantWhere(actor), orderBy: [{ provider: "asc" }, { name: "asc" }] }),
    prisma.messageTemplate.findMany({ where: tenantWhere(actor), orderBy: { createdAt: "desc" } }),
    prisma.outboundApproval.findMany({ where: tenantWhere(actor), include: { template: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.webhookEndpoint.findMany({ where: tenantWhere(actor), include: { deliveries: { orderBy: { receivedAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } }),
    prisma.captureForm.findMany({ where: tenantWhere(actor), include: { submissions: { orderBy: { receivedAt: "desc" }, take: 5 } }, orderBy: { createdAt: "desc" } }),
  ]).then(([connections, templates, approvals, endpoints, forms]) => ({ connections, templates, approvals, endpoints, forms }));
}

export async function createSandboxConnection(actor: TenantActor, provider: "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK", name: string) {
  assertPermission(actor, "integration:write");
  const trimmedName = name.trim();
  if (trimmedName.length < 3) throw new Error("Nome da integração muito curto.");
  const connection = await prisma.integrationConnection.upsert({
    where: { organizationId_provider_name: { organizationId: actor.organizationId, provider, name: trimmedName } },
    update: { status: "SANDBOX", active: true, settings: { safeMode: true, provider } },
    create: { organizationId: actor.organizationId, provider, name: trimmedName, status: "SANDBOX", settings: { safeMode: true, provider } },
  });
  await recordAudit(actor, { action: "integration.sandbox.enabled", entityType: "IntegrationConnection", entityId: connection.id, after: { provider, status: connection.status } });
  return connection;
}

export async function createMessageTemplate(actor: TenantActor, raw: { provider: "EMAIL" | "WHATSAPP"; name: string; subject?: string; body: string }) {
  assertPermission(actor, "integration:write");
  if (raw.name.trim().length < 3 || raw.body.trim().length < 5) throw new Error("Template inválido.");
  const template = await prisma.messageTemplate.create({
    data: { organizationId: actor.organizationId, provider: raw.provider, name: raw.name.trim(), subject: raw.subject?.trim() || null, body: raw.body.trim() },
  });
  await recordAudit(actor, { action: "template.created", entityType: "MessageTemplate", entityId: template.id, after: { provider: template.provider, status: template.status } });
  return template;
}

export async function reviewMessageTemplate(actor: TenantActor, templateId: string, approve: boolean) {
  assertPermission(actor, "integration:approve");
  const template = await prisma.messageTemplate.findFirst({ where: { id: templateId, organizationId: actor.organizationId } });
  if (!template) throw new Error("Template não encontrado.");
  const updated = await prisma.messageTemplate.update({
    where: { id: template.id },
    data: { status: approve ? "APPROVED" : "REJECTED", approvedById: approve ? actor.userId : null, approvedAt: approve ? new Date() : null },
  });
  await recordAudit(actor, { action: approve ? "template.approved" : "template.rejected", entityType: "MessageTemplate", entityId: updated.id, before: { status: template.status }, after: { status: updated.status } });
  return updated;
}

export async function createWebhookEndpoint(actor: TenantActor, name: string) {
  assertPermission(actor, "integration:write");
  const trimmedName = name.trim();
  if (trimmedName.length < 3) throw new Error("Nome do webhook muito curto.");
  const token = randomBytes(32).toString("base64url");
  const endpoint = await prisma.webhookEndpoint.create({
    data: { organizationId: actor.organizationId, name: trimmedName, secretHash: sha256(token), secretHint: token.slice(-6), createdById: actor.userId },
  });
  await recordAudit(actor, { action: "webhook.created", entityType: "WebhookEndpoint", entityId: endpoint.id, after: { publicId: endpoint.publicId, active: endpoint.active } });
  return { endpoint, token };
}

export async function authenticateWebhook(publicId: string, token: string) {
  const endpoint = await prisma.webhookEndpoint.findUnique({ where: { publicId } });
  if (!endpoint?.active || !token) return null;
  const provided = Buffer.from(sha256(token), "utf8");
  const expected = Buffer.from(endpoint.secretHash, "utf8");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return endpoint;
}

export async function createCaptureForm(actor: TenantActor, raw: { name: string; description?: string; source?: string }) {
  assertPermission(actor, "integration:write");
  if (raw.name.trim().length < 3) throw new Error("Nome do formulário muito curto.");
  const form = await prisma.captureForm.create({
    data: {
      organizationId: actor.organizationId,
      name: raw.name.trim(),
      description: raw.description?.trim() || null,
      source: raw.source?.trim() || "FORMULARIO_PUBLICO",
      createdById: actor.userId,
      fields: [
        { name: "contactName", label: "Seu nome", type: "text", required: true },
        { name: "companyName", label: "Empresa", type: "text", required: true },
        { name: "email", label: "E-mail", type: "email", required: true },
        { name: "phone", label: "Telefone", type: "tel", required: false },
        { name: "interest", label: "Como podemos ajudar?", type: "textarea", required: true },
      ],
    },
  });
  await recordAudit(actor, { action: "capture-form.created", entityType: "CaptureForm", entityId: form.id, after: { publicId: form.publicId, source: form.source } });
  return form;
}

export async function getPublicCaptureForm(publicId: string) {
  return prisma.captureForm.findFirst({ where: { publicId, active: true }, select: { id: true, organizationId: true, publicId: true, name: true, description: true, source: true, fields: true } });
}

export async function requestOutboundApproval(input: {
  organizationId: string;
  requestedById: string;
  provider: "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK";
  recipient: string;
  payload: Prisma.InputJsonValue;
  idempotencyKey: string;
  templateId?: string;
}) {
  await assertOutboundPrivacyAllowed({ organizationId: input.organizationId, provider: input.provider, recipient: input.recipient });
  if (input.templateId) {
    const template = await prisma.messageTemplate.findFirst({ where: { id: input.templateId, organizationId: input.organizationId, status: "APPROVED" } });
    if (!template) throw new Error("Template aprovado não encontrado.");
  }
  return prisma.outboundApproval.upsert({
    where: { organizationId_idempotencyKey: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } },
    update: {},
    create: { ...input, templateId: input.templateId || null },
  });
}

export async function reviewOutboundApproval(actor: TenantActor, approvalId: string, approve: boolean) {
  assertPermission(actor, "integration:approve");
  const approval = await prisma.outboundApproval.findFirst({ where: { id: approvalId, organizationId: actor.organizationId } });
  if (!approval) throw new Error("Solicitação de saída não encontrada.");
  if (approval.status !== "PENDING") return approval;
  if (!approve) {
    const rejected = await prisma.outboundApproval.update({ where: { id: approval.id }, data: { status: "REJECTED", reviewedById: actor.userId, reviewedAt: new Date() } });
    await recordAudit(actor, { action: "outbound.rejected", entityType: "OutboundApproval", entityId: rejected.id, after: { provider: rejected.provider, status: rejected.status } });
    return rejected;
  }
  await assertOutboundPrivacyAllowed({ organizationId: actor.organizationId, provider: approval.provider, recipient: approval.recipient });
  const payload = approval.payload && typeof approval.payload === "object" && !Array.isArray(approval.payload) ? approval.payload as Record<string, unknown> : {};
  const result = await integrationAdapter(approval.provider).deliver({ provider: approval.provider, recipient: approval.recipient, payload, idempotencyKey: approval.idempotencyKey });
  const approved = await prisma.outboundApproval.update({
    where: { id: approval.id },
    data: { status: "APPROVED", reviewedById: actor.userId, reviewedAt: new Date(), externalId: result.externalId },
  });
  await recordAudit(actor, { action: "outbound.approved", entityType: "OutboundApproval", entityId: approved.id, after: { provider: approved.provider, status: approved.status, mode: result.mode } });
  return approved;
}
