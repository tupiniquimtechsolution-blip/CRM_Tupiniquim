import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, type TenantActor } from "@/modules/shared/tenant";
import { collectPrivacySubjectData, privacySubjectCounts, privacySubjectDigest } from "./subject-data";

const PREVIEW_TTL_MS = 15 * 60_000;
const MAX_PACKAGE_BYTES = 1024 * 1024;
const executableTypes = ["CONFIRMATION_ACCESS", "PORTABILITY"] as const;

const previewPayloadSchema = z.object({
  version: z.literal(1),
  requestId: z.string().min(1),
  organizationId: z.string().min(1),
  actorId: z.string().min(1),
  requestType: z.enum(executableTypes),
  requestUpdatedAt: z.string().datetime(),
  subjectDigest: z.string().regex(/^[a-f0-9]{64}$/),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
});

export type PrivacyPreviewPayload = z.infer<typeof previewPayloadSchema>;

function previewSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET é obrigatória para previews de privacidade.");
  return secret;
}

export function createPrivacyPreviewToken(payload: PrivacyPreviewPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", previewSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyPrivacyPreviewToken(token: string, now = Date.now()) {
  try {
    const [body, signature] = token.split(".");
    if (!body || !signature) throw new Error("invalid");
    const expected = createHmac("sha256", previewSecret()).update(body).digest("base64url");
    const receivedBuffer = Buffer.from(signature, "base64url");
    const expectedBuffer = Buffer.from(expected, "base64url");
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) throw new Error("invalid");
    const payload = previewPayloadSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
    if (payload.expiresAt <= now || payload.issuedAt > now + 60_000) throw new Error("expired");
    return payload;
  } catch {
    throw new Error("Preview inválido ou expirado.");
  }
}

async function loadExecutableRequest(actor: TenantActor, requestId: string) {
  assertPermission(actor, "privacy:write");
  const request = await prisma.privacyRequest.findFirst({
    where: { id: requestId, organizationId: actor.organizationId },
  });
  if (!request || !executableTypes.includes(request.type as (typeof executableTypes)[number])) {
    throw new Error("Solicitação de privacidade indisponível para este fluxo.");
  }
  if (request.status !== "IN_PROGRESS") throw new Error("A solicitação precisa estar em atendimento antes do preview.");
  const identityAudit = await prisma.auditLog.findFirst({
    where: {
      organizationId: actor.organizationId,
      entityType: "PrivacyRequest",
      entityId: request.id,
      action: "privacy.identity.verified",
    },
    select: { id: true },
  });
  if (!identityAudit) throw new Error("Confirme a verificação de identidade antes do preview.");
  return request;
}

export async function previewPrivacyRequest(actor: TenantActor, requestId: string, now = new Date()) {
  const request = await loadExecutableRequest(actor, requestId);
  const data = await collectPrivacySubjectData(actor.organizationId, request.subjectEmail);
  const subjectDigest = privacySubjectDigest(data);
  const counts = privacySubjectCounts(data);
  const issuedAt = now.getTime();
  const expiresAt = issuedAt + PREVIEW_TTL_MS;
  const token = createPrivacyPreviewToken({
    version: 1,
    requestId: request.id,
    organizationId: actor.organizationId,
    actorId: actor.userId,
    requestType: request.type as (typeof executableTypes)[number],
    requestUpdatedAt: request.updatedAt.toISOString(),
    subjectDigest,
    issuedAt,
    expiresAt,
  });
  await recordAudit(actor, {
    action: "privacy.preview.generated",
    entityType: "PrivacyRequest",
    entityId: request.id,
    after: { type: request.type, counts, subjectDigest, expiresAt: new Date(expiresAt).toISOString() },
  });
  return { token, counts, expiresAt: new Date(expiresAt).toISOString() };
}

export async function executePrivacyRequest(actor: TenantActor, requestId: string, previewToken: string, now = new Date()) {
  assertPermission(actor, "privacy:write");
  const preview = verifyPrivacyPreviewToken(previewToken, now.getTime());
  if (preview.requestId !== requestId || preview.organizationId !== actor.organizationId || preview.actorId !== actor.userId) {
    throw new Error("Preview não pertence a esta solicitação, organização ou operador.");
  }

  const request = await loadExecutableRequest(actor, requestId);
  if (request.type !== preview.requestType || request.updatedAt.toISOString() !== preview.requestUpdatedAt) {
    throw new Error("A solicitação mudou desde o preview. Gere um novo preview.");
  }

  const data = await collectPrivacySubjectData(actor.organizationId, request.subjectEmail);
  const subjectDigest = privacySubjectDigest(data);
  if (subjectDigest !== preview.subjectDigest) throw new Error("Os dados mudaram desde o preview. Gere um novo preview.");
  const counts = privacySubjectCounts(data);
  const generatedAt = now.toISOString();
  const packageData = {
    format: "privacy-subject-v1",
    generatedAt,
    request: { protocol: request.protocol, type: request.type },
    subject: { email: data.subjectEmail },
    data,
  };
  const serialized = JSON.stringify(packageData);
  if (Buffer.byteLength(serialized, "utf8") > MAX_PACKAGE_BYTES) {
    throw new Error("O pacote excede 1 MB. Faça revisão manual do escopo antes da entrega.");
  }

  const action = request.type === "PORTABILITY" ? "privacy.portability.generated" : "privacy.access.executed";
  await prisma.$transaction(async (tx) => {
    const changed = await tx.privacyRequest.updateMany({
      where: {
        id: request.id,
        organizationId: actor.organizationId,
        status: "IN_PROGRESS",
        updatedAt: request.updatedAt,
      },
      data: {
        status: "COMPLETED",
        completedAt: now,
        reviewedById: actor.userId,
        resolution: "Pacote técnico privacy-subject-v1 gerado para revisão e entrega manual.",
      },
    });
    if (changed.count !== 1) throw new Error("Solicitação alterada por outro operador. Gere um novo preview.");

    await tx.auditLog.create({
      data: {
        organizationId: actor.organizationId,
        actorId: actor.userId,
        action,
        entityType: "PrivacyRequest",
        entityId: request.id,
        after: { format: "privacy-subject-v1", counts, subjectDigest },
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
        after: { status: "COMPLETED", type: request.type },
      },
    });
  });

  const safeProtocol = request.protocol.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return { fileName: `lgpd-${safeProtocol}.json`, packageData };
}
