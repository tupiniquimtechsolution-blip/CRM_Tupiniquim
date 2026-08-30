import { describe, expect, it } from "vitest";
import { buildReport, type ReportInput } from "./domain";

const input: ReportInput = {
  leads: [{ id: "l1", source: "Evento", status: "QUALIFIED", assignedToId: "u1", assignedToName: "Ana" }, { id: "l2", source: "Evento", status: "NEW", assignedToId: "u1", assignedToName: "Ana" }],
  opportunities: [{ id: "o1", status: "OPEN", value: 1000, probability: 50, lostReason: null, ownerId: "u1", ownerName: "Ana" }, { id: "o2", status: "WON", value: 2000, probability: 100, lostReason: null, ownerId: "u1", ownerName: "Ana" }, { id: "o3", status: "LOST", value: 500, probability: 0, lostReason: "Preço", ownerId: "u2", ownerName: "Beto" }],
  activities: [{ id: "a1", status: "OPEN", dueAt: new Date("2026-08-01"), completedAt: null, assignedToId: "u1", assignedToName: "Ana" }],
  tickets: [{ id: "t1", status: "OPEN", slaDueAt: new Date("2026-08-01"), resolvedAt: null }],
  revenues: [{ id: "r1", type: "MRR", status: "ACTIVE", amount: 300, companyId: "c1", companyName: "Acme", segment: "Tech" }, { id: "r2", type: "PROJECT", status: "FORECAST", amount: 900, companyId: "c1", companyName: "Acme", segment: "Tech" }],
  companies: [{ id: "c1", segment: "Tech", lifecycle: "CUSTOMER" }],
  upsells: [{ id: "u1", status: "QUALIFIED", potentialValue: 700, ownerId: "u1", ownerName: "Ana" }],
};

describe("report reconciliation", () => {
  it("reconciles totals with detailed records", () => {
    const report = buildReport(input, new Date("2026-08-13"));
    expect(report.executive.pipelineValue).toBe(1000);
    expect(report.executive.weightedForecast).toBe(500);
    expect(report.executive.mrr).toBe(300);
    expect(report.executive.projectRevenue).toBe(900);
    expect(report.segments.reduce((sum, segment) => sum + segment.mrr, 0)).toBe(report.executive.mrr);
    expect(report.reconciliation.opportunityIds).toHaveLength(input.opportunities.length);
  });

  it("calculates conversion and SLA without division errors", () => {
    const report = buildReport(input, new Date("2026-08-13"));
    expect(report.executive.leadQualificationRate).toBe(50);
    expect(report.executive.winRate).toBe(50);
    expect(report.executive.sla.overdueActivities).toBe(1);
    expect(report.executive.sla.overdueTickets).toBe(1);
  });
});
