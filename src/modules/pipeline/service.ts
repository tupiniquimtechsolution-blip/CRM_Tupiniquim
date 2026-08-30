import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { opportunitySchema, validateOpportunityOutcome } from "./domain";

export async function listPipeline(actor: TenantActor) {
  assertPermission(actor, "crm:read");
  return prisma.pipeline.findFirst({
    where: { ...tenantWhere(actor), active: true },
    include: {
      stages: {
        orderBy: { position: "asc" },
        include: {
          opportunities: {
            where: { organizationId: actor.organizationId, status: "OPEN" },
            include: { company: true, owner: true },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  });
}

export async function createOpportunity(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "pipeline:write");
  const data = opportunitySchema.parse(raw);
  const [company, stage] = await Promise.all([
    prisma.company.findFirst({ where: { id: data.companyId, organizationId: actor.organizationId } }),
    prisma.pipelineStage.findFirst({
      where: { id: data.stageId, pipelineId: data.pipelineId, pipeline: { organizationId: actor.organizationId } },
    }),
  ]);
  if (!company || !stage) throw new Error("Empresa, funil ou etapa fora da organização ativa.");
  return prisma.opportunity.create({
    data: {
      organizationId: actor.organizationId,
      ownerId: actor.userId,
      companyId: company.id,
      pipelineId: data.pipelineId,
      stageId: stage.id,
      title: data.title,
      value: data.value,
      expectedCloseAt: data.expectedCloseAt,
    },
  });
}

export async function moveOpportunity(actor: TenantActor, opportunityId: string, toStageId: string) {
  assertPermission(actor, "pipeline:write");
  return prisma.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.findFirst({
      where: { id: opportunityId, organizationId: actor.organizationId, status: "OPEN" },
    });
    if (!opportunity) throw new Error("Oportunidade não encontrada.");
    const stage = await tx.pipelineStage.findFirst({
      where: { id: toStageId, pipelineId: opportunity.pipelineId, pipeline: { organizationId: actor.organizationId } },
    });
    if (!stage) throw new Error("Etapa inválida para este funil.");
    const updated = await tx.opportunity.update({ where: { id: opportunity.id }, data: { stageId: stage.id } });
    await tx.opportunityStageHistory.create({
      data: { opportunityId: opportunity.id, fromStageId: opportunity.stageId, toStageId: stage.id, changedById: actor.userId },
    });
    return updated;
  });
}

export async function closeOpportunity(
  actor: TenantActor,
  opportunityId: string,
  status: "WON" | "LOST",
  lostReason?: string,
) {
  assertPermission(actor, "pipeline:write");
  validateOpportunityOutcome(status, lostReason);
  return prisma.opportunity.updateMany({
    where: { id: opportunityId, organizationId: actor.organizationId, status: "OPEN" },
    data: { status, lostReason: lostReason || null },
  });
}
