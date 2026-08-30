import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import {
  calculateCustomerHealth,
  canTransitionRenewal,
  canTransitionTicket,
  canTransitionUpsell,
  onboardingPlanSchema,
  renewalSchema,
  ticketSchema,
  upsellSchema,
} from "./domain";

const defaultOnboardingSteps = [
  "Reunião de kick-off",
  "Coleta de acessos e requisitos",
  "Configuração e implantação",
  "Treinamento da equipe",
  "Go-live e aceite",
];

async function requireCustomer(actor: TenantActor, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, organizationId: actor.organizationId, lifecycle: "CUSTOMER" },
  });
  if (!company) throw new Error("Cliente inválido para a organização ativa.");
  return company;
}

export async function listCustomers(actor: TenantActor) {
  assertPermission(actor, "customer:read");
  return prisma.company.findMany({
    where: { ...tenantWhere(actor), lifecycle: { in: ["CUSTOMER", "INACTIVE"] } },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      leads: { orderBy: { createdAt: "desc" }, take: 3 },
      opportunities: { orderBy: { updatedAt: "desc" }, take: 5 },
      proposals: { orderBy: { updatedAt: "desc" }, take: 5 },
      contracts: { orderBy: { createdAt: "desc" }, take: 5 },
      revenues: { orderBy: { startsAt: "desc" }, take: 20 },
      activities: { orderBy: { createdAt: "desc" }, take: 5 },
      notes: { orderBy: { createdAt: "desc" }, take: 5 },
      onboardingPlans: { include: { steps: { orderBy: { position: "asc" } }, owner: true }, orderBy: { createdAt: "desc" }, take: 2 },
      tickets: { include: { assignedTo: true }, orderBy: { createdAt: "desc" }, take: 10 },
      healthScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      renewals: { include: { owner: true, contract: true }, orderBy: { renewalAt: "asc" }, take: 5 },
      upsellOpportunities: { include: { owner: true }, orderBy: { updatedAt: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function createOnboardingPlan(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "customer:write");
  const data = onboardingPlanSchema.parse(raw);
  await requireCustomer(actor, data.companyId);
  const stepTitles = data.stepTitles?.length ? data.stepTitles : defaultOnboardingSteps;
  const plan = await prisma.onboardingPlan.create({
    data: {
      organizationId: actor.organizationId,
      companyId: data.companyId,
      ownerId: data.ownerId || actor.userId,
      name: data.name,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      targetCompletionAt: data.targetCompletionAt,
      steps: {
        create: stepTitles.map((title, index) => ({
          organizationId: actor.organizationId,
          assignedToId: data.ownerId || actor.userId,
          title,
          position: index + 1,
        })),
      },
    },
  });
  await recordAudit(actor, { action: "onboarding.created", entityType: "OnboardingPlan", entityId: plan.id, after: { companyId: plan.companyId, status: plan.status, steps: stepTitles.length } });
  return plan;
}

export async function updateOnboardingStep(actor: TenantActor, stepId: string, targetStatus: string) {
  assertPermission(actor, "customer:write");
  const allowed = ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETED", "SKIPPED"] as const;
  if (!allowed.includes(targetStatus as (typeof allowed)[number])) throw new Error("Estado de onboarding inválido.");
  const step = await prisma.onboardingStep.findFirst({ where: { id: stepId, organizationId: actor.organizationId }, include: { plan: true } });
  if (!step) throw new Error("Etapa de onboarding não encontrada.");
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.onboardingStep.update({
      where: { id: step.id },
      data: {
        status: targetStatus as "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "SKIPPED",
        completedAt: targetStatus === "COMPLETED" || targetStatus === "SKIPPED" ? now : null,
      },
    });
    const remaining = await tx.onboardingStep.count({ where: { planId: step.planId, status: { notIn: ["COMPLETED", "SKIPPED"] } } });
    await tx.onboardingPlan.update({
      where: { id: step.planId },
      data: remaining === 0
        ? { status: "COMPLETED", completedAt: now }
        : { status: targetStatus === "BLOCKED" ? "BLOCKED" : "IN_PROGRESS", completedAt: null, startedAt: step.plan.startedAt ?? now },
    });
    return result;
  });
  await recordAudit(actor, { action: "onboarding.step.updated", entityType: "OnboardingStep", entityId: updated.id, before: { status: step.status }, after: { status: updated.status } });
  return updated;
}

export async function createTicket(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "customer:write");
  const data = ticketSchema.parse(raw);
  await requireCustomer(actor, data.companyId);
  if (data.contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: data.contactId, companyId: data.companyId, organizationId: actor.organizationId } });
    if (!contact) throw new Error("Contato inválido para o cliente selecionado.");
  }
  const ticket = await prisma.$transaction(async (tx) => {
    const last = await tx.ticket.findFirst({ where: tenantWhere(actor), orderBy: { number: "desc" }, select: { number: true } });
    return tx.ticket.create({
      data: {
        organizationId: actor.organizationId,
        companyId: data.companyId,
        contactId: data.contactId || null,
        assignedToId: data.assignedToId || actor.userId,
        createdById: actor.userId,
        number: (last?.number ?? 0) + 1,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        channel: data.channel,
        slaDueAt: data.slaDueAt,
      },
    });
  });
  await recordAudit(actor, { action: "ticket.created", entityType: "Ticket", entityId: ticket.id, after: { number: ticket.number, companyId: ticket.companyId, priority: ticket.priority } });
  return ticket;
}

export async function transitionTicket(actor: TenantActor, ticketId: string, targetStatus: string) {
  assertPermission(actor, "customer:write");
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, organizationId: actor.organizationId } });
  if (!ticket) throw new Error("Ticket não encontrado.");
  if (!canTransitionTicket(ticket.status, targetStatus)) throw new Error("Transição de ticket inválida.");
  const now = new Date();
  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: targetStatus as "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED",
      firstResponseAt: ticket.firstResponseAt ?? (targetStatus === "IN_PROGRESS" ? now : null),
      resolvedAt: targetStatus === "RESOLVED" || targetStatus === "CLOSED" ? now : null,
    },
  });
  await recordAudit(actor, { action: "ticket.transitioned", entityType: "Ticket", entityId: updated.id, before: { status: ticket.status }, after: { status: updated.status } });
  return updated;
}

export async function createRenewal(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "customer:write");
  const data = renewalSchema.parse(raw);
  await requireCustomer(actor, data.companyId);
  if (data.contractId) {
    const contract = await prisma.contract.findFirst({ where: { id: data.contractId, companyId: data.companyId, organizationId: actor.organizationId } });
    if (!contract) throw new Error("Contrato inválido para o cliente selecionado.");
  }
  const renewal = await prisma.renewal.create({
    data: {
      organizationId: actor.organizationId,
      companyId: data.companyId,
      contractId: data.contractId || null,
      ownerId: data.ownerId || actor.userId,
      title: data.title,
      amount: data.amount,
      renewalAt: data.renewalAt,
      probability: data.probability,
      notes: data.notes || null,
    },
  });
  await recordAudit(actor, { action: "renewal.created", entityType: "Renewal", entityId: renewal.id, after: { companyId: renewal.companyId, renewalAt: renewal.renewalAt.toISOString(), amount: Number(renewal.amount) } });
  return renewal;
}

export async function transitionRenewal(actor: TenantActor, renewalId: string, targetStatus: string, churnReason?: string) {
  assertPermission(actor, "customer:write");
  const renewal = await prisma.renewal.findFirst({ where: { id: renewalId, organizationId: actor.organizationId } });
  if (!renewal) throw new Error("Renovação não encontrada.");
  if (!canTransitionRenewal(renewal.status, targetStatus, churnReason)) throw new Error("Transição de renovação inválida ou motivo de churn ausente.");
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.renewal.update({
      where: { id: renewal.id },
      data: {
        status: targetStatus as "UPCOMING" | "IN_NEGOTIATION" | "RENEWED" | "CHURNED" | "CANCELLED",
        probability: targetStatus === "RENEWED" ? 100 : targetStatus === "CHURNED" ? 0 : renewal.probability,
        churnReason: targetStatus === "CHURNED" ? churnReason!.trim() : renewal.churnReason,
        churnedAt: targetStatus === "CHURNED" ? now : null,
      },
    });
    if (targetStatus === "CHURNED") {
      await tx.company.update({ where: { id: renewal.companyId }, data: { lifecycle: "INACTIVE" } });
      await tx.revenue.updateMany({
        where: { organizationId: actor.organizationId, companyId: renewal.companyId, type: "MRR", status: "ACTIVE" },
        data: { status: "ENDED", endsAt: now },
      });
    }
    return result;
  });
  await recordAudit(actor, { action: "renewal.transitioned", entityType: "Renewal", entityId: updated.id, before: { status: renewal.status }, after: { status: updated.status, churnReason: updated.churnReason ?? undefined } });
  return updated;
}

export async function createUpsellOpportunity(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "customer:write");
  const data = upsellSchema.parse(raw);
  await requireCustomer(actor, data.companyId);
  const upsell = await prisma.upsellOpportunity.create({
    data: {
      organizationId: actor.organizationId,
      companyId: data.companyId,
      ownerId: data.ownerId || actor.userId,
      title: data.title,
      description: data.description || null,
      potentialValue: data.potentialValue,
      expectedCloseAt: data.expectedCloseAt,
      source: data.source,
    },
  });
  await recordAudit(actor, { action: "upsell.created", entityType: "UpsellOpportunity", entityId: upsell.id, after: { companyId: upsell.companyId, value: Number(upsell.potentialValue), status: upsell.status } });
  return upsell;
}

export async function transitionUpsellOpportunity(actor: TenantActor, upsellId: string, targetStatus: string) {
  assertPermission(actor, "customer:write");
  const upsell = await prisma.upsellOpportunity.findFirst({ where: { id: upsellId, organizationId: actor.organizationId }, include: { revenue: true } });
  if (!upsell) throw new Error("Oportunidade de upsell não encontrada.");
  if (upsell.status === targetStatus) return upsell;
  if (!canTransitionUpsell(upsell.status, targetStatus)) throw new Error("Transição de upsell inválida.");
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    let revenueId = upsell.revenueId;
    if (targetStatus === "WON" && !revenueId) {
      const revenue = await tx.revenue.create({
        data: {
          organizationId: actor.organizationId,
          companyId: upsell.companyId,
          type: "UPSELL",
          status: "ACTIVE",
          description: upsell.title,
          amount: upsell.potentialValue,
          startsAt: now,
        },
      });
      revenueId = revenue.id;
    }
    return tx.upsellOpportunity.update({
      where: { id: upsell.id },
      data: {
        status: targetStatus as "IDENTIFIED" | "QUALIFIED" | "PROPOSED" | "WON" | "LOST",
        revenueId,
        wonAt: targetStatus === "WON" ? now : null,
        lostAt: targetStatus === "LOST" ? now : null,
      },
    });
  });
  await recordAudit(actor, { action: "upsell.transitioned", entityType: "UpsellOpportunity", entityId: updated.id, before: { status: upsell.status }, after: { status: updated.status, revenueId: updated.revenueId ?? undefined } });
  return updated;
}

export async function refreshCustomerHealth(actor: TenantActor, companyId: string, now = new Date()) {
  assertPermission(actor, "customer:write");
  const company = await prisma.company.findFirst({
    where: { id: companyId, organizationId: actor.organizationId, lifecycle: { in: ["CUSTOMER", "INACTIVE"] } },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
      onboardingPlans: { where: { status: { not: "CANCELLED" } }, include: { steps: true }, orderBy: { createdAt: "desc" }, take: 1 },
      tickets: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] } } },
      revenues: { where: { status: { in: ["ACTIVE", "FORECAST"] } } },
      renewals: { where: { status: { in: ["UPCOMING", "IN_NEGOTIATION", "RENEWED", "CHURNED"] } }, orderBy: { renewalAt: "asc" }, take: 1 },
    },
  });
  if (!company) throw new Error("Cliente inválido para a organização ativa.");
  const onboarding = company.onboardingPlans[0];
  const renewal = company.renewals[0];
  const latestActivity = company.activities[0]?.createdAt;
  const daysSinceLastInteraction = latestActivity ? Math.max(0, Math.floor((now.getTime() - latestActivity.getTime()) / 86_400_000)) : null;
  const renewalDaysRemaining = renewal ? Math.ceil((renewal.renewalAt.getTime() - now.getTime()) / 86_400_000) : null;
  const assessment = calculateCustomerHealth({
    daysSinceLastInteraction,
    onboardingStatus: onboarding?.status ?? null,
    onboardingCompletedSteps: onboarding?.steps.filter((step) => step.status === "COMPLETED" || step.status === "SKIPPED").length ?? 0,
    onboardingTotalSteps: onboarding?.steps.length ?? 0,
    openTickets: company.tickets.length,
    overdueTickets: company.tickets.filter((ticket) => ticket.slaDueAt && ticket.slaDueAt < now).length,
    urgentTickets: company.tickets.filter((ticket) => ticket.priority === "URGENT").length,
    hasActiveRevenue: company.revenues.some((revenue) => revenue.status === "ACTIVE"),
    hasForecastRevenue: company.revenues.some((revenue) => revenue.status === "FORECAST"),
    renewalStatus: renewal?.status ?? null,
    renewalDaysRemaining,
  });
  const score = await prisma.customerHealthScore.create({
    data: { organizationId: actor.organizationId, companyId, ...assessment },
  });
  await recordAudit(actor, { action: "customer.health.calculated", entityType: "CustomerHealthScore", entityId: score.id, after: { companyId, score: score.score, band: score.band, version: score.calculationVersion } });
  return score;
}
