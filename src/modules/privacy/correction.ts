import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, type TenantActor } from "@/modules/shared/tenant";

const PREVIEW_TTL_MS = 15 * 60_000;
export const CORRECTION_PREVIEW_COOKIE = "crm_privacy_correction_preview";

export const correctionInputSchema = z.object({
  entityType: z.enum(["Contact", "Company"]),
  entityId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(2).max(160),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).transform((value) => value ? value.toLowerCase() : null),
  phone: z.string().trim().max(40).transform((value) => value || null),
}).strict();

const changesSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  email: z.string().email().max(254).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
}).strict();

const correctionPreviewSchema = z.object({
  version: z.literal(1),
  requestId: z.string().min(1),
  organizationId: z.string().min(1),
  actorId: z.string().min(1),
  entityType: z.enum(["Contact", "Company"]),
  entityId: z.string().min(1),
  requestUpdatedAt: z.string().datetime(),
  targetUpdatedAt: z.string().datetime(),
  changes: changesSchema,
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
});

type CorrectionInput = z.infer<typeof correctionInputSchema>;
type CorrectionChanges = z.infer<typeof changesSchema>;
type CorrectionPreview = z.infer<typeof correctionPreviewSchema>;
type CorrectionTarget = {
  entityType: "Contact" | "Company";
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  updatedAt: Date;
};

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) throw new Error("AUTH_SECRET é obrigatória para previews de correção.");
  return value;
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function signPreview(payload: CorrectionPreview) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyCorrectionPreviewToken(token: string, now = Date.now()) {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) throw new Error("invalid");
    const expected = createHmac("sha256", secret()).update(body).digest("base64url");
    const actualBytes = Buffer.from(signature, "base64url");
    const expectedBytes = Buffer.from(expected, "base64url");
    if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) throw new Error("invalid");
    const payload = correctionPreviewSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
    if (payload.expiresAt <= now || payload.issuedAt > now + 60_000) throw new Error("expired");
    return payload;
  } catch {
    throw new Error("Preview de correção inválido ou expirado.");
  }
}

export function calculateCorrectionChanges(
  before: Pick<CorrectionTarget, "name" | "email" | "phone">,
  input: Pick<CorrectionInput, "name" | "email" | "phone">,
): CorrectionChanges {
  const changes: CorrectionChanges = {};
  if (input.name !== before.name) changes.name = input.name;
  if (input.email !== (before.email?.toLowerCase() ?? null)) changes.email = input.email;
  if (input.phone !== (before.phone?.trim() || null)) changes.phone = input.phone;
  return changes;
}

async function loadCorrectionRequest(actor: TenantActor, requestId: string) {
  assertPermission(actor, "privacy:write");
  const request = await prisma.privacyRequest.findFirst({ where: { id: requestId, organizationId: actor.organizationId } });
  if (!request || request.type !== "CORRECTION") throw new Error("Solicitação de correção indisponível.");
  if (request.status !== "IN_PROGRESS") throw new Error("A solicitação de correção precisa estar em atendimento.");
  const identityAudit = await prisma.auditLog.findFirst({
    where: { organizationId: actor.organizationId, entityType: "PrivacyRequest", entityId: request.id, action: "privacy.identity.verified" },
    select: { id: true },
  });
  if (!identityAudit) throw new Error("Confirme a identidade antes de corrigir dados.");
  return request;
}

async function loadTarget(organizationId: string, subjectEmail: string, entityType: CorrectionTarget["entityType"], entityId: string): Promise<CorrectionTarget | null> {
  if (entityType === "Contact") {
    const row = await prisma.contact.findFirst({
      where: { id: entityId, organizationId, email: { equals: subjectEmail, mode: "insensitive" } },
      select: { id: true, name: true, email: true, phone: true, updatedAt: true },
    });
    return row ? { entityType, ...row } : null;
  }
  const row = await prisma.company.findFirst({
    where: { id: entityId, organizationId, email: { equals: subjectEmail, mode: "insensitive" } },
    select: { id: true, name: true, email: true, phone: true, updatedAt: true },
  });
  return row ? { entityType, ...row } : null;
}

export async function listCorrectionTargets(actor: TenantActor, requestId: string) {
  const request = await loadCorrectionRequest(actor, requestId);
  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId: actor.organizationId, email: { equals: request.subjectEmail, mode: "insensitive" } },
      select: { id: true, name: true, email: true, phone: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.company.findMany({
      where: { organizationId: actor.organizationId, email: { equals: request.subjectEmail, mode: "insensitive" } },
      select: { id: true, name: true, email: true, phone: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);
  return {
    request: { id: request.id, protocol: request.protocol, subjectEmail: request.subjectEmail },
    targets: [
      ...contacts.map((row) => ({ entityType: "Contact" as const, ...row })),
      ...companies.map((row) => ({ entityType: "Company" as const, ...row })),
    ],
  };
}

export async function previewCorrection(actor: TenantActor, requestId: string, raw: unknown, now = new Date()) {
  const input = correctionInputSchema.parse(raw);
  const request = await loadCorrectionRequest(actor, requestId);
  const target = await loadTarget(actor.organizationId, request.subjectEmail, input.entityType, input.entityId);
  if (!target) throw new Error("Registro elegível para correção não encontrado na organização ativa.");
  const changes = calculateCorrectionChanges(target, input);
  const fields = Object.keys(changes);
  if (!fields.length) throw new Error("Informe ao menos uma alteração real antes de gerar o preview.");
  const issuedAt = now.getTime();
  const expiresAt = issuedAt + PREVIEW_TTL_MS;
  const token = signPreview({
    version: 1,
    requestId: request.id,
    organizationId: actor.organizationId,
    actorId: actor.userId,
    entityType: target.entityType,
    entityId: target.id,
    requestUpdatedAt: request.updatedAt.toISOString(),
    targetUpdatedAt: target.updatedAt.toISOString(),
    changes,
    issuedAt,
    expiresAt,
  });
  await recordAudit(actor, {
    action: "privacy.correction.preview",
    entityType: "PrivacyRequest",
    entityId: request.id,
    after: { targetType: target.entityType, targetId: target.id, fields, expiresAt: new Date(expiresAt).toISOString() },
  });
  return { token, expiresAt: new Date(expiresAt).toISOString(), before: target, after: { ...target, ...changes }, fields };
}

export async function readCorrectionPreview(actor: TenantActor, requestId: string, token: string, now = new Date()) {
  const preview = verifyCorrectionPreviewToken(token, now.getTime());
  if (preview.requestId !== requestId || preview.organizationId !== actor.organizationId || preview.actorId !== actor.userId) {
    throw new Error("Preview de correção não pertence a esta solicitação, organização ou operador.");
  }
  const request = await loadCorrectionRequest(actor, requestId);
  if (request.updatedAt.toISOString() !== preview.requestUpdatedAt) throw new Error("A solicitação mudou desde o preview.");
  const target = await loadTarget(actor.organizationId, request.subjectEmail, preview.entityType, preview.entityId);
  if (!target || target.updatedAt.toISOString() !== preview.targetUpdatedAt) throw new Error("O registro mudou desde o preview.");
  return { preview, before: target, after: { ...target, ...preview.changes }, fields: Object.keys(preview.changes) };
}

export async function executeCorrection(actor: TenantActor, requestId: string, token: string, now = new Date()) {
  const { preview, before, after, fields } = await readCorrectionPreview(actor, requestId, token, now);
  const request = await loadCorrectionRequest(actor, requestId);
  const beforeValues = Object.fromEntries(fields.map((field) => [field, before[field as "name" | "email" | "phone"]]));
  const afterValues = Object.fromEntries(fields.map((field) => [field, after[field as "name" | "email" | "phone"]]));

  await prisma.$transaction(async (tx) => {
    const targetWhere = { id: preview.entityId, organizationId: actor.organizationId, updatedAt: new Date(preview.targetUpdatedAt) };
    const changed = preview.entityType === "Contact"
      ? await tx.contact.updateMany({ where: targetWhere, data: preview.changes })
      : await tx.company.updateMany({ where: targetWhere, data: preview.changes });
    if (changed.count !== 1) throw new Error("O registro mudou desde o preview. Gere uma nova prévia.");

    const completed = await tx.privacyRequest.updateMany({
      where: { id: request.id, organizationId: actor.organizationId, status: "IN_PROGRESS", updatedAt: new Date(preview.requestUpdatedAt) },
      data: { status: "COMPLETED", completedAt: now, reviewedById: actor.userId, resolution: "Correção allowlisted aplicada após preview e validação de identidade." },
    });
    if (completed.count !== 1) throw new Error("A solicitação mudou desde o preview. Gere uma nova prévia.");

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.userId,
        action: "privacy.correction.executed",
        entityType: preview.entityType,
        entityId: preview.entityId,
        before: { requestId: request.id, fields, digest: digest(beforeValues) },
        after: { requestId: request.id, fields, digest: digest(afterValues) },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.userId,
        action: "privacy.request.completed",
        entityType: "PrivacyRequest",
        entityId: request.id,
        before: { status: "IN_PROGRESS" },
        after: { status: "COMPLETED", type: "CORRECTION", targetType: preview.entityType, targetId: preview.entityId, fields },
      },
    });
  });

  return { requestId: request.id, entityType: preview.entityType, entityId: preview.entityId, fields };
}
