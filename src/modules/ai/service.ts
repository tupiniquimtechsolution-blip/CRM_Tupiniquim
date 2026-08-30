import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { stableKey } from "@/modules/automations/domain";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { aiAssistAdapter } from "./adapter";
import { aiAssistKinds, type AiAssistKind } from "./domain";

async function authorizedContext(actor: TenantActor, kind: AiAssistKind, entityId: string) {
  if (kind === "LEAD_CLASSIFICATION") {
    const lead = await prisma.lead.findFirst({ where: { id: entityId, organizationId: actor.organizationId }, include: { company: { select: { name: true, segment: true, lifecycle: true } }, tags: { include: { tag: { select: { name: true } } } } } });
    if (!lead) throw new Error("Lead não encontrado na organização ativa.");
    return { name: lead.title, entityType: "Lead", status: lead.status, score: lead.score, source: lead.source, validationSource: lead.validationSource, company: lead.company.name, segment: lead.company.segment, companyLifecycle: lead.company.lifecycle, tags: lead.tags.map((item) => item.tag.name), notesAvailable: Boolean(lead.notes) };
  }

  const company = await prisma.company.findFirst({
    where: { id: entityId, organizationId: actor.organizationId },
    include: {
      healthScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      tickets: { orderBy: { createdAt: "desc" }, take: 20 },
      renewals: { orderBy: { renewalAt: "asc" }, take: 10 },
      revenues: { orderBy: { startsAt: "desc" }, take: 50 },
      onboardingPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      opportunities: { orderBy: { updatedAt: "desc" }, take: 20 },
    },
  });
  if (!company) throw new Error("Empresa não encontrada na organização ativa.");
  const health = company.healthScores[0];
  return {
    name: company.name,
    entityType: "Company",
    segment: company.segment,
    lifecycle: company.lifecycle,
    health: health ? { score: health.score, band: health.band } : null,
    risks: health && Array.isArray(health.riskFactors) ? health.riskFactors : [],
    openTickets: company.tickets.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).map((item) => ({ subject: item.subject, priority: item.priority, status: item.status, slaDueAt: item.slaDueAt?.toISOString() ?? null })),
    renewals: company.renewals.map((item) => ({ title: item.title, status: item.status, amount: Number(item.amount), renewalAt: item.renewalAt.toISOString(), probability: item.probability })),
    revenue: {
      mrr: company.revenues.filter((item) => item.type === "MRR" && item.status === "ACTIVE").reduce((sum, item) => sum + Number(item.amount), 0),
      projects: company.revenues.filter((item) => item.type === "PROJECT" && ["ACTIVE", "FORECAST"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount), 0),
      upsell: company.revenues.filter((item) => item.type === "UPSELL" && item.status === "ACTIVE").reduce((sum, item) => sum + Number(item.amount), 0),
    },
    onboarding: company.onboardingPlans[0]?.status ?? null,
    opportunities: company.opportunities.map((item) => ({ title: item.title, status: item.status, value: Number(item.value), expectedCloseAt: item.expectedCloseAt?.toISOString() ?? null, lostReason: item.lostReason })),
    requestedOutput: kind === "MESSAGE_DRAFT" ? "Rascunho comercial sem envio" : "Resumo executivo da conta",
  };
}

export function aiConfigurationStatus() {
  return { provider: process.env.AI_PROVIDER === "simulated" || !process.env.OPENAI_API_KEY ? "SIMULATED" : "OPENAI", model: process.env.OPENAI_MODEL || "gpt-5.4-mini" };
}

export async function listAiWorkspace(actor: TenantActor) {
  assertPermission(actor, "ai:use");
  const [requests, companies, leads] = await Promise.all([
    prisma.aiAssistRequest.findMany({ where: tenantWhere(actor), orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.company.findMany({ where: tenantWhere(actor), select: { id: true, name: true, lifecycle: true }, orderBy: { name: "asc" }, take: 100 }),
    prisma.lead.findMany({ where: tenantWhere(actor), select: { id: true, title: true, company: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return { requests, companies, leads, configuration: aiConfigurationStatus() };
}

export async function createAiAssistRequest(actor: TenantActor, raw: { kind: string; entityId: string }) {
  assertPermission(actor, "ai:use");
  if (!aiAssistKinds.includes(raw.kind as AiAssistKind)) throw new Error("Tipo de assistência inválido.");
  const kind = raw.kind as AiAssistKind;
  const context = await authorizedContext(actor, kind, raw.entityId);
  const entityType = kind === "LEAD_CLASSIFICATION" ? "Lead" : "Company";
  const digest = stableKey(actor.organizationId, entityType, raw.entityId, JSON.stringify(context));
  const request = await prisma.aiAssistRequest.create({
    data: { organizationId: actor.organizationId, requestedById: actor.userId, kind, entityType, entityId: raw.entityId, provider: "PENDING", model: "PENDING", inputDigest: digest, sanitizedContext: context as Prisma.InputJsonObject, status: "PROCESSING" },
  });
  try {
    const generation = await aiAssistAdapter().generate(kind, context);
    const updated = await prisma.aiAssistRequest.update({ where: { id: request.id }, data: { provider: generation.provider, model: generation.model, output: generation.output as Prisma.InputJsonObject, status: "GENERATED" } });
    await recordAudit(actor, { action: "ai.draft.generated", entityType: "AiAssistRequest", entityId: updated.id, after: { kind, provider: updated.provider, model: updated.model, status: updated.status, inputDigest: digest } });
    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na geração.";
    await prisma.aiAssistRequest.update({ where: { id: request.id }, data: { status: "FAILED", error: message } });
    await recordAudit(actor, { action: "ai.draft.failed", entityType: "AiAssistRequest", entityId: request.id, after: { kind, status: "FAILED" } });
    throw new Error("Não foi possível gerar o rascunho. Verifique a configuração da IA e tente novamente.");
  }
}

export async function reviewAiAssistRequest(actor: TenantActor, requestId: string, approve: boolean) {
  assertPermission(actor, "ai:review");
  const request = await prisma.aiAssistRequest.findFirst({ where: { id: requestId, organizationId: actor.organizationId } });
  if (!request) throw new Error("Rascunho de IA não encontrado.");
  if (request.status !== "GENERATED") return request;
  const updated = await prisma.aiAssistRequest.update({ where: { id: request.id }, data: { status: approve ? "APPROVED" : "REJECTED", reviewedById: actor.userId, reviewedAt: new Date() } });
  await recordAudit(actor, { action: approve ? "ai.draft.approved" : "ai.draft.rejected", entityType: "AiAssistRequest", entityId: updated.id, before: { status: request.status }, after: { status: updated.status } });
  return updated;
}
