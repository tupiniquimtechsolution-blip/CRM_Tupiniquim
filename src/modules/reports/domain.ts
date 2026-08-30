export type ReportInput = {
  leads: Array<{ id: string; source: string; status: string; assignedToId: string | null; assignedToName: string | null }>;
  opportunities: Array<{ id: string; status: "OPEN" | "WON" | "LOST"; value: number; probability: number; lostReason: string | null; ownerId: string | null; ownerName: string | null }>;
  activities: Array<{ id: string; status: string; dueAt: Date | null; completedAt: Date | null; assignedToId: string | null; assignedToName: string | null }>;
  tickets: Array<{ id: string; status: string; slaDueAt: Date | null; resolvedAt: Date | null }>;
  revenues: Array<{ id: string; type: "MRR" | "PROJECT" | "UPSELL"; status: string; amount: number; companyId: string; companyName: string; segment: string | null }>;
  companies: Array<{ id: string; segment: string | null; lifecycle: string }>;
  upsells: Array<{ id: string; status: string; potentialValue: number; ownerId: string | null; ownerName: string | null }>;
};

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 10_000) / 100 : 0;
}

function grouped<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) map.set(key(row), [...(map.get(key(row)) ?? []), row]);
  return map;
}

export function buildReport(input: ReportInput, now = new Date()) {
  const qualifiedLeads = input.leads.filter((lead) => ["QUALIFIED", "CONVERTED"].includes(lead.status)).length;
  const won = input.opportunities.filter((opportunity) => opportunity.status === "WON");
  const lost = input.opportunities.filter((opportunity) => opportunity.status === "LOST");
  const closed = won.length + lost.length;
  const open = input.opportunities.filter((opportunity) => opportunity.status === "OPEN");
  const openActivities = input.activities.filter((activity) => activity.status === "OPEN");
  const overdueActivities = openActivities.filter((activity) => activity.dueAt && activity.dueAt < now);
  const openTickets = input.tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const overdueTickets = openTickets.filter((ticket) => ticket.slaDueAt && ticket.slaDueAt < now);
  const activeMrr = input.revenues.filter((revenue) => revenue.type === "MRR" && revenue.status === "ACTIVE");
  const projects = input.revenues.filter((revenue) => revenue.type === "PROJECT" && ["ACTIVE", "FORECAST"].includes(revenue.status));
  const bookedUpsell = input.revenues.filter((revenue) => revenue.type === "UPSELL" && revenue.status === "ACTIVE");
  const openUpsells = input.upsells.filter((upsell) => !["WON", "LOST"].includes(upsell.status));

  const origins = [...grouped(input.leads, (lead) => lead.source || "Não informada")].map(([name, leads]) => ({ name, total: leads.length, qualified: leads.filter((lead) => ["QUALIFIED", "CONVERTED"].includes(lead.status)).length })).sort((a, b) => b.total - a.total);
  const losses = [...grouped(lost, (opportunity) => opportunity.lostReason || "Sem motivo informado")].map(([reason, opportunities]) => ({ reason, total: opportunities.length, value: opportunities.reduce((sum, item) => sum + item.value, 0) })).sort((a, b) => b.value - a.value);
  const sellers = [...grouped(input.opportunities, (opportunity) => opportunity.ownerId || "unassigned")].map(([ownerId, opportunities]) => ({
    ownerId,
    name: opportunities[0]?.ownerName || "Não atribuído",
    open: opportunities.filter((item) => item.status === "OPEN").length,
    won: opportunities.filter((item) => item.status === "WON").length,
    lost: opportunities.filter((item) => item.status === "LOST").length,
    openValue: opportunities.filter((item) => item.status === "OPEN").reduce((sum, item) => sum + item.value, 0),
    wonValue: opportunities.filter((item) => item.status === "WON").reduce((sum, item) => sum + item.value, 0),
  })).sort((a, b) => b.wonValue - a.wonValue);
  const revenueByCompany = grouped(activeMrr, (revenue) => revenue.companyId);
  const segments = [...grouped(input.companies, (company) => company.segment || "Não informado")].map(([name, companies]) => ({
    name,
    companies: companies.length,
    customers: companies.filter((company) => company.lifecycle === "CUSTOMER").length,
    mrr: companies.reduce((sum, company) => sum + (revenueByCompany.get(company.id) ?? []).reduce((revenueSum, revenue) => revenueSum + revenue.amount, 0), 0),
  })).sort((a, b) => b.mrr - a.mrr);

  return {
    executive: {
      leads: input.leads.length,
      qualifiedLeads,
      leadQualificationRate: percent(qualifiedLeads, input.leads.length),
      opportunities: input.opportunities.length,
      wins: won.length,
      losses: lost.length,
      winRate: percent(won.length, closed),
      pipelineValue: open.reduce((sum, item) => sum + item.value, 0),
      weightedForecast: open.reduce((sum, item) => sum + item.value * item.probability / 100, 0),
      sla: { openActivities: openActivities.length, overdueActivities: overdueActivities.length, openTickets: openTickets.length, overdueTickets: overdueTickets.length },
      mrr: activeMrr.reduce((sum, item) => sum + item.amount, 0),
      projectRevenue: projects.reduce((sum, item) => sum + item.amount, 0),
      bookedUpsell: bookedUpsell.reduce((sum, item) => sum + item.amount, 0),
      openUpsellPotential: openUpsells.reduce((sum, item) => sum + item.potentialValue, 0),
    },
    origins,
    losses,
    sellers,
    segments,
    reconciliation: {
      opportunityIds: input.opportunities.map((item) => item.id),
      mrrRevenueIds: activeMrr.map((item) => item.id),
      projectRevenueIds: projects.map((item) => item.id),
      upsellIds: openUpsells.map((item) => item.id),
    },
  };
}

export type CrmReport = ReturnType<typeof buildReport>;
