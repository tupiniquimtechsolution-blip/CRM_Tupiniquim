import { z } from "zod";

export const onboardingPlanSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().trim().min(3).max(120),
  ownerId: z.string().optional(),
  targetCompletionAt: z.coerce.date().optional(),
  stepTitles: z.array(z.string().trim().min(3).max(120)).min(1).max(20).optional(),
});

export const ticketSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  channel: z.string().trim().min(2).max(40).default("INTERNAL"),
  slaDueAt: z.coerce.date().optional(),
});

export const renewalSchema = z.object({
  companyId: z.string().min(1),
  contractId: z.string().optional(),
  ownerId: z.string().optional(),
  title: z.string().trim().min(3).max(160),
  amount: z.coerce.number().nonnegative(),
  renewalAt: z.coerce.date(),
  probability: z.coerce.number().int().min(0).max(100).default(50),
  notes: z.string().trim().max(3000).optional(),
});

export const upsellSchema = z.object({
  companyId: z.string().min(1),
  ownerId: z.string().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(3000).optional(),
  potentialValue: z.coerce.number().positive(),
  expectedCloseAt: z.coerce.date().optional(),
  source: z.string().trim().min(2).max(80).default("CUSTOMER_SUCCESS"),
});

export type CustomerHealthInput = {
  daysSinceLastInteraction: number | null;
  onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED" | null;
  onboardingCompletedSteps: number;
  onboardingTotalSteps: number;
  openTickets: number;
  overdueTickets: number;
  urgentTickets: number;
  hasActiveRevenue: boolean;
  hasForecastRevenue: boolean;
  renewalStatus: "UPCOMING" | "IN_NEGOTIATION" | "RENEWED" | "CHURNED" | "CANCELLED" | null;
  renewalDaysRemaining: number | null;
};

export type CustomerHealthAssessment = {
  score: number;
  band: "HEALTHY" | "ATTENTION" | "AT_RISK" | "CRITICAL";
  engagementScore: number;
  supportScore: number;
  onboardingScore: number;
  revenueScore: number;
  renewalScore: number;
  riskFactors: string[];
  calculationVersion: "v1";
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function engagementScore(days: number | null) {
  if (days === null) return 20;
  if (days <= 7) return 100;
  if (days <= 14) return 85;
  if (days <= 30) return 65;
  if (days <= 60) return 40;
  return 15;
}

function onboardingScore(input: CustomerHealthInput) {
  if (input.onboardingStatus === "COMPLETED") return 100;
  if (input.onboardingStatus === "BLOCKED") return 25;
  if (input.onboardingStatus === "CANCELLED") return 20;
  if (input.onboardingTotalSteps === 0) return 70;
  return clamp((input.onboardingCompletedSteps / input.onboardingTotalSteps) * 100);
}

function renewalScore(input: CustomerHealthInput) {
  if (input.renewalStatus === "CHURNED" || input.renewalStatus === "CANCELLED") return 0;
  if (input.renewalStatus === "RENEWED") return 100;
  if (input.renewalDaysRemaining === null) return 90;
  if (input.renewalDaysRemaining < 0) return 15;
  if (input.renewalDaysRemaining <= 30) return input.renewalStatus === "IN_NEGOTIATION" ? 75 : 50;
  if (input.renewalDaysRemaining <= 90) return 85;
  return 100;
}

export function calculateCustomerHealth(input: CustomerHealthInput): CustomerHealthAssessment {
  const engagement = engagementScore(input.daysSinceLastInteraction);
  const support = clamp(100 - input.openTickets * 8 - input.overdueTickets * 18 - input.urgentTickets * 12);
  const onboarding = onboardingScore(input);
  const revenue = input.hasActiveRevenue ? 100 : input.hasForecastRevenue ? 65 : 25;
  const renewal = renewalScore(input);
  const risks: string[] = [];

  if (input.daysSinceLastInteraction === null || input.daysSinceLastInteraction > 30) risks.push("Cliente sem interação recente");
  if (input.overdueTickets > 0) risks.push("Ticket com SLA vencido");
  if (input.urgentTickets > 0) risks.push("Ticket urgente em aberto");
  if (input.onboardingStatus === "BLOCKED") risks.push("Onboarding bloqueado");
  if (!input.hasActiveRevenue) risks.push("Sem receita ativa");
  if (input.renewalDaysRemaining !== null && input.renewalDaysRemaining <= 30 && input.renewalStatus !== "RENEWED") risks.push("Renovação requer atenção");
  if (input.renewalStatus === "CHURNED") risks.push("Churn confirmado");

  let score = clamp(engagement * 0.3 + support * 0.25 + onboarding * 0.15 + revenue * 0.15 + renewal * 0.15);
  if (input.renewalStatus === "CHURNED") score = Math.min(score, 25);
  const band = score >= 80 ? "HEALTHY" : score >= 60 ? "ATTENTION" : score >= 40 ? "AT_RISK" : "CRITICAL";

  return {
    score,
    band,
    engagementScore: engagement,
    supportScore: support,
    onboardingScore: onboarding,
    revenueScore: revenue,
    renewalScore: renewal,
    riskFactors: risks,
    calculationVersion: "v1",
  };
}

export function canTransitionTicket(current: string, target: string) {
  const transitions: Record<string, string[]> = {
    OPEN: ["IN_PROGRESS", "CLOSED"],
    IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED"],
    WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED"],
    RESOLVED: ["IN_PROGRESS", "CLOSED"],
    CLOSED: [],
  };
  return transitions[current]?.includes(target) ?? false;
}

export function canTransitionRenewal(current: string, target: string, churnReason?: string) {
  const transitions: Record<string, string[]> = {
    UPCOMING: ["IN_NEGOTIATION", "RENEWED", "CHURNED", "CANCELLED"],
    IN_NEGOTIATION: ["RENEWED", "CHURNED", "CANCELLED"],
    RENEWED: [],
    CHURNED: [],
    CANCELLED: [],
  };
  if (target === "CHURNED" && !churnReason?.trim()) return false;
  return transitions[current]?.includes(target) ?? false;
}

export function canTransitionUpsell(current: string, target: string) {
  const transitions: Record<string, string[]> = {
    IDENTIFIED: ["QUALIFIED", "LOST"],
    QUALIFIED: ["PROPOSED", "LOST"],
    PROPOSED: ["WON", "LOST"],
    WON: [],
    LOST: [],
  };
  return transitions[current]?.includes(target) ?? false;
}
