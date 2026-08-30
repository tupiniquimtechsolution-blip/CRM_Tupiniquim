import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { buildReport } from "./domain";

export async function getCrmReport(actor: TenantActor, now = new Date()) {
  assertPermission(actor, "reports:read");
  const [leads, opportunities, activities, tickets, revenues, companies, upsells] = await Promise.all([
    prisma.lead.findMany({ where: tenantWhere(actor), include: { assignedTo: { select: { name: true } } } }),
    prisma.opportunity.findMany({ where: tenantWhere(actor), include: { stage: { select: { probability: true } }, owner: { select: { name: true } } } }),
    prisma.activity.findMany({ where: tenantWhere(actor), include: { assignedTo: { select: { name: true } } } }),
    prisma.ticket.findMany({ where: tenantWhere(actor) }),
    prisma.revenue.findMany({ where: tenantWhere(actor), include: { company: { select: { name: true, segment: true } } } }),
    prisma.company.findMany({ where: tenantWhere(actor), select: { id: true, segment: true, lifecycle: true } }),
    prisma.upsellOpportunity.findMany({ where: tenantWhere(actor), include: { owner: { select: { name: true } } } }),
  ]);
  return buildReport({
    leads: leads.map((item) => ({ id: item.id, source: item.source, status: item.status, assignedToId: item.assignedToId, assignedToName: item.assignedTo?.name ?? null })),
    opportunities: opportunities.map((item) => ({ id: item.id, status: item.status, value: Number(item.value), probability: item.stage.probability, lostReason: item.lostReason, ownerId: item.ownerId, ownerName: item.owner?.name ?? null })),
    activities: activities.map((item) => ({ id: item.id, status: item.status, dueAt: item.dueAt, completedAt: item.completedAt, assignedToId: item.assignedToId, assignedToName: item.assignedTo?.name ?? null })),
    tickets: tickets.map((item) => ({ id: item.id, status: item.status, slaDueAt: item.slaDueAt, resolvedAt: item.resolvedAt })),
    revenues: revenues.map((item) => ({ id: item.id, type: item.type, status: item.status, amount: Number(item.amount), companyId: item.companyId, companyName: item.company.name, segment: item.company.segment })),
    companies,
    upsells: upsells.map((item) => ({ id: item.id, status: item.status, potentialValue: Number(item.potentialValue), ownerId: item.ownerId, ownerName: item.owner?.name ?? null })),
  }, now);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function reportCsv(report: Awaited<ReturnType<typeof getCrmReport>>, type: string) {
  const rows: Array<Array<string | number>> = [["Relatório", type], ["Gerado em", new Date().toISOString()], []];
  rows.push(["Indicador", "Valor"],
    ["Leads", report.executive.leads], ["Leads qualificados", report.executive.qualifiedLeads], ["Taxa de qualificação (%)", report.executive.leadQualificationRate],
    ["Oportunidades", report.executive.opportunities], ["Ganhos", report.executive.wins], ["Perdas", report.executive.losses], ["Win rate (%)", report.executive.winRate],
    ["Pipeline", report.executive.pipelineValue], ["Forecast ponderado", report.executive.weightedForecast], ["MRR", report.executive.mrr], ["Projetos", report.executive.projectRevenue], ["Upsell realizado", report.executive.bookedUpsell], ["Upsell potencial", report.executive.openUpsellPotential], []);
  rows.push(["Origem", "Total", "Qualificados"], ...report.origins.map((item) => [item.name, item.total, item.qualified] as Array<string | number>), []);
  rows.push(["Vendedor", "Abertas", "Ganhas", "Perdidas", "Valor aberto", "Valor ganho"], ...report.sellers.map((item) => [item.name, item.open, item.won, item.lost, item.openValue, item.wonValue] as Array<string | number>), []);
  rows.push(["Segmento", "Empresas", "Clientes", "MRR"], ...report.segments.map((item) => [item.name, item.companies, item.customers, item.mrr] as Array<string | number>), []);
  rows.push(["Motivo de perda", "Quantidade", "Valor"], ...report.losses.map((item) => [item.reason, item.total, item.value] as Array<string | number>));
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

export async function createReportExport(actor: TenantActor, reportType: string) {
  assertPermission(actor, "reports:export");
  const allowed = ["EXECUTIVO", "VENDEDORES", "SEGMENTOS"];
  if (!allowed.includes(reportType)) throw new Error("Tipo de relatório inválido.");
  const report = await getCrmReport(actor);
  const createdAt = new Date();
  const exportRow = await prisma.reportExport.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      reportType,
      filters: {} as Prisma.InputJsonObject,
      fileName: `crm-tupiniquim-${reportType.toLocaleLowerCase()}-${createdAt.toISOString().slice(0, 10)}.csv`,
      content: reportCsv(report, reportType),
      expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1_000),
    },
  });
  await recordAudit(actor, { action: "report.export.created", entityType: "ReportExport", entityId: exportRow.id, after: { reportType, expiresAt: exportRow.expiresAt.toISOString() } });
  return exportRow;
}

export async function getAuthorizedExport(actor: TenantActor, exportId: string) {
  assertPermission(actor, "reports:export");
  const row = await prisma.reportExport.findFirst({ where: { id: exportId, organizationId: actor.organizationId, userId: actor.userId, status: "READY" } });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await prisma.reportExport.update({ where: { id: row.id }, data: { status: "EXPIRED" } });
    return null;
  }
  return row;
}
