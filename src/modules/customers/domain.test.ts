import { describe, expect, it } from "vitest";
import { calculateCustomerHealth, canTransitionRenewal, canTransitionTicket, canTransitionUpsell } from "./domain";

describe("saúde e retenção do cliente", () => {
  it("classifica como saudável uma conta engajada e sem pendências", () => {
    const result = calculateCustomerHealth({
      daysSinceLastInteraction: 3,
      onboardingStatus: "COMPLETED",
      onboardingCompletedSteps: 5,
      onboardingTotalSteps: 5,
      openTickets: 0,
      overdueTickets: 0,
      urgentTickets: 0,
      hasActiveRevenue: true,
      hasForecastRevenue: false,
      renewalStatus: "RENEWED",
      renewalDaysRemaining: 180,
    });
    expect(result).toMatchObject({ score: 100, band: "HEALTHY", calculationVersion: "v1" });
    expect(result.riskFactors).toEqual([]);
  });

  it("mantém churn confirmado na faixa crítica", () => {
    const result = calculateCustomerHealth({
      daysSinceLastInteraction: 90,
      onboardingStatus: "BLOCKED",
      onboardingCompletedSteps: 1,
      onboardingTotalSteps: 5,
      openTickets: 3,
      overdueTickets: 2,
      urgentTickets: 1,
      hasActiveRevenue: false,
      hasForecastRevenue: false,
      renewalStatus: "CHURNED",
      renewalDaysRemaining: -10,
    });
    expect(result.band).toBe("CRITICAL");
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.riskFactors).toContain("Churn confirmado");
  });

  it("exige justificativa para registrar churn", () => {
    expect(canTransitionRenewal("IN_NEGOTIATION", "CHURNED")).toBe(false);
    expect(canTransitionRenewal("IN_NEGOTIATION", "CHURNED", "Encerramento da operação")).toBe(true);
  });

  it("restringe transições de tickets e upsells", () => {
    expect(canTransitionTicket("OPEN", "IN_PROGRESS")).toBe(true);
    expect(canTransitionTicket("CLOSED", "OPEN")).toBe(false);
    expect(canTransitionUpsell("PROPOSED", "WON")).toBe(true);
    expect(canTransitionUpsell("IDENTIFIED", "WON")).toBe(false);
  });
});
