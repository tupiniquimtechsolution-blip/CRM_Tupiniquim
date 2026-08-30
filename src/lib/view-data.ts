import { demoActivities, demoCompanies, demoCustomers, demoLeads, demoProposals, demoRevenues, demoStages } from "@/lib/demo-data";
import { listCompanies } from "@/modules/companies/service";
import { listLeads } from "@/modules/leads/service";
import { listPipeline } from "@/modules/pipeline/service";
import { listActivities } from "@/modules/activities/service";
import { listProposals } from "@/modules/proposals/service";
import { listRevenues } from "@/modules/revenues/service";
import { listCustomers } from "@/modules/customers/service";
import type { TenantActor } from "@/modules/shared/tenant";

const isDemo = () => process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production";

export async function companiesView(actor: TenantActor) {
  if (isDemo()) return demoCompanies;
  return (await listCompanies(actor)).map((row) => ({
    id: row.id, name: row.name, segment: row.segment ?? "Não informado", lifecycle: row.lifecycle,
    owner: "Equipe comercial", contacts: row.contacts.length,
  }));
}

export async function leadsView(actor: TenantActor) {
  if (isDemo()) return demoLeads;
  return (await listLeads(actor)).map((row) => ({
    id: row.id, company: row.company.name, title: row.title, source: row.source,
    status: row.status, score: row.score, owner: row.assignedTo?.name ?? "Não atribuído",
  }));
}

export async function pipelineView(actor: TenantActor) {
  if (isDemo()) return demoStages;
  const pipeline = await listPipeline(actor);
  return (pipeline?.stages ?? []).map((stage) => ({
    id: stage.id, name: stage.name, color: stage.color,
    opportunities: stage.opportunities.map((row) => ({
      id: row.id, title: row.title, company: row.company.name, value: Number(row.value),
      owner: row.owner?.name ?? "Não atribuído", due: row.expectedCloseAt?.toLocaleDateString("pt-BR") ?? "Sem data",
    })),
  }));
}

export async function activitiesView(actor: TenantActor) {
  if (isDemo()) return demoActivities;
  return (await listActivities(actor)).map((row) => ({
    id: row.id, title: row.title, type: row.type, due: row.dueAt?.toLocaleString("pt-BR") ?? "Sem prazo",
    owner: row.assignedTo?.name ?? "Não atribuído", status: row.status,
    company: row.company?.name ?? row.opportunity?.title ?? "Geral",
  }));
}

export async function proposalsView(actor: TenantActor) {
  if (isDemo()) return demoProposals;
  return (await listProposals(actor)).map((row) => ({
    id: row.id, number: `#${String(row.number).padStart(4, "0")}`, title: row.title,
    company: row.company.name, total: Number(row.total), status: row.status,
    validUntil: row.validUntil?.toLocaleDateString("pt-BR") ?? "Sem prazo",
  }));
}

export async function revenuesView(actor: TenantActor) {
  if (isDemo()) return demoRevenues;
  return (await listRevenues(actor)).map((row) => ({
    id: row.id, company: row.company.name, type: row.type, description: row.description,
    amount: Number(row.amount), status: row.status,
  }));
}

const onboardingStatus: Record<string, string> = {
  NOT_STARTED: "Não iniciado", IN_PROGRESS: "Em andamento", BLOCKED: "Bloqueado", COMPLETED: "Concluído", CANCELLED: "Cancelado",
};
const onboardingStepStatus: Record<string, string> = {
  PENDING: "Pendente", IN_PROGRESS: "Em andamento", BLOCKED: "Bloqueada", COMPLETED: "Concluída", SKIPPED: "Ignorada",
};
const ticketStatus: Record<string, string> = {
  OPEN: "Aberto", IN_PROGRESS: "Em andamento", WAITING_CUSTOMER: "Aguardando cliente", RESOLVED: "Resolvido", CLOSED: "Fechado",
};
const priorityLabel: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" };
const healthBand: Record<string, string> = { HEALTHY: "Saudável", ATTENTION: "Atenção", AT_RISK: "Em risco", CRITICAL: "Crítica" };
const renewalStatus: Record<string, string> = { UPCOMING: "Próxima", IN_NEGOTIATION: "Em negociação", RENEWED: "Renovada", CHURNED: "Churn", CANCELLED: "Cancelada" };
const upsellStatus: Record<string, string> = { IDENTIFIED: "Identificado", QUALIFIED: "Qualificado", PROPOSED: "Proposto", WON: "Ganho", LOST: "Perdido" };

export async function customersView(actor: TenantActor) {
  if (isDemo()) return demoCustomers;
  const now = new Date();
  return (await listCustomers(actor)).map((row) => {
    const currentOnboarding = row.onboardingPlans[0];
    const completedSteps = currentOnboarding?.steps.filter((step) => step.status === "COMPLETED" || step.status === "SKIPPED").length ?? 0;
    const totalSteps = currentOnboarding?.steps.length ?? 0;
    const health = row.healthScores[0];
    return {
      id: row.id,
      name: row.name,
      segment: row.segment ?? "Não informado",
      owner: row.ownerId ? "Responsável da conta" : "Equipe CS",
      health: {
        score: health?.score ?? 0,
        band: health ? healthBand[health.band] : "Não calculada",
        risks: Array.isArray(health?.riskFactors) ? health.riskFactors.filter((value): value is string => typeof value === "string") : [],
      },
      mrr: row.revenues.filter((revenue) => revenue.type === "MRR" && revenue.status === "ACTIVE").reduce((sum, revenue) => sum + Number(revenue.amount), 0),
      projectRevenue: row.revenues.filter((revenue) => revenue.type === "PROJECT" && revenue.status === "ACTIVE").reduce((sum, revenue) => sum + Number(revenue.amount), 0),
      journey: { leads: row.leads.length, opportunities: row.opportunities.length, proposals: row.proposals.length, contracts: row.contracts.length, activities: row.activities.length },
      onboarding: currentOnboarding ? {
        id: currentOnboarding.id,
        name: currentOnboarding.name,
        status: onboardingStatus[currentOnboarding.status],
        progress: totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0,
        steps: currentOnboarding.steps.map((step) => ({ id: step.id, title: step.title, status: onboardingStepStatus[step.status] })),
      } : null,
      tickets: row.tickets.map((ticket) => ({
        id: ticket.id,
        number: `#${String(ticket.number).padStart(4, "0")}`,
        subject: ticket.subject,
        status: ticketStatus[ticket.status],
        priority: priorityLabel[ticket.priority],
        sla: ticket.slaDueAt?.toLocaleString("pt-BR") ?? "Sem SLA",
        overdue: Boolean(ticket.slaDueAt && ticket.slaDueAt < now && !["RESOLVED", "CLOSED"].includes(ticket.status)),
      })),
      renewals: row.renewals.map((renewal) => ({
        id: renewal.id,
        title: renewal.title,
        status: renewalStatus[renewal.status],
        amount: Number(renewal.amount),
        date: renewal.renewalAt.toLocaleDateString("pt-BR"),
        days: Math.ceil((renewal.renewalAt.getTime() - now.getTime()) / 86_400_000),
      })),
      upsells: row.upsellOpportunities.map((upsell) => ({
        id: upsell.id,
        title: upsell.title,
        status: upsellStatus[upsell.status],
        value: Number(upsell.potentialValue),
        date: upsell.expectedCloseAt?.toLocaleDateString("pt-BR") ?? "Sem previsão",
      })),
    };
  });
}
