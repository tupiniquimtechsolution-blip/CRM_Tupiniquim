import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, type TenantActor } from "@/modules/shared/tenant";

const requestSchema = z.object({
  type: z.enum(["CONFIRMATION_ACCESS", "CORRECTION", "ANONYMIZATION_BLOCKING_DELETION", "PORTABILITY", "CONSENT_REVOCATION", "OPPOSITION", "AUTOMATED_DECISION_REVIEW"]),
  subjectEmail: z.string().trim().email().transform((value) => value.toLocaleLowerCase()),
  subjectName: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  details: z.string().trim().max(2_000).optional().or(z.literal("")),
});

const retentionSchema = z.object({
  commercialDataDays: z.coerce.number().int().min(30).max(3650),
  captureSubmissionDays: z.coerce.number().int().min(30).max(3650),
  reportExportDays: z.coerce.number().int().min(1).max(30),
  aiRequestDays: z.coerce.number().int().min(1).max(1825),
  auditLogDays: z.coerce.number().int().min(365).max(3650),
  incidentLogDays: z.coerce.number().int().min(1825).max(3650),
});

const statusSchema = z.enum(["IDENTITY_VERIFICATION", "IN_PROGRESS", "COMPLETED", "DENIED"]);
const incidentSchema = z.object({
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(4_000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  personalDataInvolved: z.boolean(),
  relevantRisk: z.boolean(),
});

function protocol(prefix: string) {
  return `${prefix}-${new Date().getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function daysAgo(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 86_400_000);
}

export function addBusinessDays(start: Date, days: number) {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (![0, 6].includes(result.getUTCDay())) remaining--;
  }
  return result;
}

export async function listPrivacyWorkspace(actor: TenantActor) {
  assertPermission(actor, "privacy:read");
  const [requests, consents, policy, incidents] = await Promise.all([
    prisma.privacyRequest.findMany({ where: { organizationId: actor.organizationId }, orderBy: { requestedAt: "desc" }, take: 100 }),
    prisma.privacyConsent.findMany({ where: { organizationId: actor.organizationId }, orderBy: { collectedAt: "desc" }, take: 100 }),
    prisma.dataRetentionPolicy.findUnique({ where: { organizationId: actor.organizationId } }),
    prisma.securityIncident.findMany({ where: { organizationId: actor.organizationId }, orderBy: { detectedAt: "desc" }, take: 30 }),
  ]);
  return { requests, consents, policy, incidents };
}

export async function createPrivacyRequest(actor: TenantActor, input: z.input<typeof requestSchema>) {
  assertPermission(actor, "privacy:write");
  const data = requestSchema.parse(input);
  const created = await prisma.privacyRequest.create({
    data: {
      organizationId: actor.organizationId,
      protocol: protocol("LGPD"),
      type: data.type,
      subjectEmail: data.subjectEmail,
      subjectName: data.subjectName || null,
      details: data.details || null,
      dueAt: new Date(Date.now() + 15 * 86_400_000),
      createdById: actor.userId,
    },
  });
  await recordAudit(actor, { action: "privacy.request.created", entityType: "PrivacyRequest", entityId: created.id, after: { protocol: created.protocol, type: created.type, status: created.status } });
  return created;
}

export async function updatePrivacyRequest(actor: TenantActor, requestId: string, status: z.input<typeof statusSchema>, resolution?: string) {
  assertPermission(actor, "privacy:write");
  const nextStatus = statusSchema.parse(status);
  const existing = await prisma.privacyRequest.findFirstOrThrow({ where: { id: requestId, organizationId: actor.organizationId } });
  if (["COMPLETED", "DENIED"].includes(existing.status)) throw new Error("Solicitação já encerrada.");

  const allowed: Record<typeof existing.status, readonly string[]> = {
    RECEIVED: ["IDENTITY_VERIFICATION", "DENIED"],
    IDENTITY_VERIFICATION: ["IN_PROGRESS", "DENIED"],
    IN_PROGRESS: ["COMPLETED", "DENIED"],
    COMPLETED: [],
    DENIED: [],
  };
  if (!allowed[existing.status].includes(nextStatus)) throw new Error("Transição de privacidade inválida.");
  const dedicatedExecution = ["CONFIRMATION_ACCESS", "PORTABILITY", "CORRECTION", "ANONYMIZATION_BLOCKING_DELETION", "AUTOMATED_DECISION_REVIEW"];
  if (nextStatus === "COMPLETED" && dedicatedExecution.includes(existing.type)) {
    throw new Error("Este direito exige fluxo técnico dedicado antes da conclusão.");
  }

  const normalizedResolution = resolution?.trim().slice(0, 2_000) || null;
  if (nextStatus === "DENIED" && !normalizedResolution) throw new Error("Informe a justificativa para negar a solicitação.");

  if (nextStatus === "COMPLETED") {
    const identityAudit = await prisma.auditLog.findFirst({
      where: {
        organizationId: actor.organizationId,
        entityType: "PrivacyRequest",
        entityId: existing.id,
        action: "privacy.identity.verified",
      },
      select: { id: true },
    });
    if (!identityAudit) throw new Error("Confirme a verificação de identidade antes de concluir a solicitação.");
  }

  return prisma.$transaction(async (tx) => {
    const changed = await tx.privacyRequest.updateMany({
      where: {
        id: existing.id,
        organizationId: actor.organizationId,
        status: existing.status,
        updatedAt: existing.updatedAt,
      },
      data: {
        status: nextStatus,
        resolution: normalizedResolution,
        reviewedById: actor.userId,
        completedAt: ["COMPLETED", "DENIED"].includes(nextStatus) ? new Date() : null,
      },
    });
    if (changed.count !== 1) throw new Error("Solicitação alterada por outro operador. Recarregue e tente novamente.");

    let revokedConsents = 0;
    if (nextStatus === "COMPLETED" && existing.type === "CONSENT_REVOCATION") {
      const revoked = await tx.privacyConsent.updateMany({
        where: {
          organizationId: actor.organizationId,
          subjectEmail: { equals: existing.subjectEmail, mode: "insensitive" },
          status: "GRANTED",
        },
        data: { status: "REVOKED", revokedAt: new Date() },
      });
      revokedConsents = revoked.count;
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          action: "privacy.consent.revoked",
          entityType: "PrivacyRequest",
          entityId: existing.id,
          after: { count: revokedConsents },
        },
      });
    }

    if (nextStatus === "COMPLETED" && existing.type === "OPPOSITION") {
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          action: "privacy.opposition.recorded",
          entityType: "PrivacyRequest",
          entityId: existing.id,
          after: { enforcement: "email-sandbox-outbound", status: "ACTIVE" },
        },
      });
    }

    if (existing.status === "IDENTITY_VERIFICATION" && nextStatus === "IN_PROGRESS") {
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          action: "privacy.identity.verified",
          entityType: "PrivacyRequest",
          entityId: existing.id,
          after: { status: nextStatus },
        },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.userId,
        action: "privacy.request.updated",
        entityType: "PrivacyRequest",
        entityId: existing.id,
        before: { status: existing.status },
        after: { status: nextStatus, type: existing.type, ...(revokedConsents ? { revokedConsents } : {}) },
      },
    });

    return tx.privacyRequest.findFirstOrThrow({ where: { id: existing.id, organizationId: actor.organizationId } });
  });
}

export async function saveRetentionPolicy(actor: TenantActor, input: z.input<typeof retentionSchema>) {
  assertPermission(actor, "privacy:write");
  const data = retentionSchema.parse(input);
  const policy = await prisma.dataRetentionPolicy.upsert({
    where: { organizationId: actor.organizationId },
    update: { ...data, updatedById: actor.userId },
    create: { organizationId: actor.organizationId, ...data, updatedById: actor.userId },
  });
  await recordAudit(actor, { action: "privacy.retention.updated", entityType: "DataRetentionPolicy", entityId: policy.id, after: data });
  return policy;
}

export async function createSecurityIncident(actor: TenantActor, input: z.input<typeof incidentSchema>) {
  assertPermission(actor, "privacy:write");
  const data = incidentSchema.parse(input);
  const detectedAt = new Date();
  const incident = await prisma.securityIncident.create({
    data: {
      organizationId: actor.organizationId,
      protocol: protocol("INC"),
      ...data,
      detectedAt,
      notificationDueAt: data.personalDataInvolved && data.relevantRisk ? addBusinessDays(detectedAt, 3) : null,
      createdById: actor.userId,
    },
  });
  await recordAudit(actor, { action: "security.incident.created", entityType: "SecurityIncident", entityId: incident.id, after: { protocol: incident.protocol, severity: incident.severity, personalDataInvolved: incident.personalDataInvolved, relevantRisk: incident.relevantRisk } });
  return incident;
}

export async function evaluateRetention(actor: TenantActor, execute = false, now = new Date()) {
  assertPermission(actor, execute ? "privacy:write" : "privacy:read");
  const policy = await prisma.dataRetentionPolicy.findUnique({ where: { organizationId: actor.organizationId } });
  const effective = policy ?? {
    captureSubmissionDays: 730,
    reportExportDays: 1,
    aiRequestDays: 365,
    auditLogDays: 1825,
    incidentLogDays: 1825,
  };
  const where = {
    capture: { organizationId: actor.organizationId, receivedAt: { lt: daysAgo(effective.captureSubmissionDays, now) } },
    exports: { organizationId: actor.organizationId, createdAt: { lt: daysAgo(effective.reportExportDays, now) } },
    ai: { organizationId: actor.organizationId, createdAt: { lt: daysAgo(effective.aiRequestDays, now) } },
    audit: { organizationId: actor.organizationId, createdAt: { lt: daysAgo(effective.auditLogDays, now) } },
    incidents: { organizationId: actor.organizationId, createdAt: { lt: daysAgo(effective.incidentLogDays, now) }, status: "CLOSED" as const },
  };
  const counts = {
    captureSubmissions: await prisma.captureSubmission.count({ where: where.capture }),
    reportExports: await prisma.reportExport.count({ where: where.exports }),
    aiRequests: await prisma.aiAssistRequest.count({ where: where.ai }),
    auditLogs: await prisma.auditLog.count({ where: where.audit }),
    securityIncidents: await prisma.securityIncident.count({ where: where.incidents }),
  };
  if (!execute) return { executed: false, counts };
  await prisma.$transaction([
    prisma.captureSubmission.deleteMany({ where: where.capture }),
    prisma.reportExport.deleteMany({ where: where.exports }),
    prisma.aiAssistRequest.deleteMany({ where: where.ai }),
    prisma.auditLog.deleteMany({ where: where.audit }),
    prisma.securityIncident.deleteMany({ where: where.incidents }),
  ]);
  await recordAudit(actor, { action: "privacy.retention.executed", entityType: "Organization", entityId: actor.organizationId, after: counts });
  return { executed: true, counts };
}
