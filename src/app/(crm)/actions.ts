"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/current-actor";
import { createCompany } from "@/modules/companies/service";
import { createLead } from "@/modules/leads/service";
import { createActivity } from "@/modules/activities/service";
import { createProposal } from "@/modules/proposals/service";
import { createRevenue } from "@/modules/revenues/service";
import { createOnboardingPlan, createRenewal, createTicket, createUpsellOpportunity, refreshCustomerHealth, transitionRenewal, transitionTicket, transitionUpsellOpportunity, updateOnboardingStep } from "@/modules/customers/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function demoMode() {
  return process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production";
}

export async function createCompanyAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createCompany(actor, {
    name: value(formData, "name"), tradeName: value(formData, "tradeName"), document: value(formData, "document"),
    website: value(formData, "website"), phone: value(formData, "phone"), email: value(formData, "email"),
    segment: value(formData, "segment"), source: value(formData, "source"),
  });
  revalidatePath("/empresas");
}

export async function createLeadAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createLead(actor, {
    companyId: value(formData, "companyId"), title: value(formData, "title"), source: value(formData, "source"),
    validationSource: value(formData, "validationSource"), assignedToId: value(formData, "assignedToId"),
    score: Number(value(formData, "score") || 0), notes: value(formData, "notes"),
  });
  revalidatePath("/leads");
}

export async function createActivityAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createActivity(actor, {
    title: value(formData, "title"), type: value(formData, "type"), dueAt: value(formData, "dueAt"),
    companyId: value(formData, "companyId") || undefined, description: value(formData, "description"),
  });
  revalidatePath("/atividades");
}

export async function createProposalAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createProposal(actor, {
    companyId: value(formData, "companyId"), opportunityId: value(formData, "opportunityId"),
    title: value(formData, "title"), discount: Number(value(formData, "discount") || 0),
    validUntil: value(formData, "validUntil") || undefined,
    items: [{ description: value(formData, "description"), quantity: Number(value(formData, "quantity")), unitPrice: Number(value(formData, "unitPrice")) }],
  });
  revalidatePath("/propostas");
}

export async function createRevenueAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createRevenue(actor, {
    companyId: value(formData, "companyId"), type: value(formData, "type"), description: value(formData, "description"),
    amount: Number(value(formData, "amount")), startsAt: value(formData, "startsAt"),
  });
  revalidatePath("/receitas");
}

export async function createOnboardingAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createOnboardingPlan(actor, {
    companyId: value(formData, "companyId"),
    name: value(formData, "name"),
    targetCompletionAt: value(formData, "targetCompletionAt") || undefined,
  });
  revalidatePath("/clientes");
}

export async function createTicketAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createTicket(actor, {
    companyId: value(formData, "companyId"),
    subject: value(formData, "subject"),
    description: value(formData, "description"),
    priority: value(formData, "priority"),
    channel: value(formData, "channel") || "INTERNAL",
    slaDueAt: value(formData, "slaDueAt") || undefined,
  });
  revalidatePath("/clientes");
}

export async function createRenewalAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createRenewal(actor, {
    companyId: value(formData, "companyId"),
    title: value(formData, "title"),
    amount: Number(value(formData, "amount")),
    renewalAt: value(formData, "renewalAt"),
    probability: Number(value(formData, "probability") || 50),
    notes: value(formData, "notes"),
  });
  revalidatePath("/clientes");
}

export async function createUpsellAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await createUpsellOpportunity(actor, {
    companyId: value(formData, "companyId"),
    title: value(formData, "title"),
    description: value(formData, "description"),
    potentialValue: Number(value(formData, "potentialValue")),
    expectedCloseAt: value(formData, "expectedCloseAt") || undefined,
  });
  revalidatePath("/clientes");
}

export async function updateOnboardingStepAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await updateOnboardingStep(actor, value(formData, "stepId"), value(formData, "status"));
  revalidatePath("/clientes");
}

export async function transitionTicketAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await transitionTicket(actor, value(formData, "ticketId"), value(formData, "status"));
  revalidatePath("/clientes");
}

export async function transitionRenewalAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await transitionRenewal(actor, value(formData, "renewalId"), value(formData, "status"), value(formData, "churnReason"));
  revalidatePath("/clientes");
  revalidatePath("/receitas");
}

export async function transitionUpsellAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await transitionUpsellOpportunity(actor, value(formData, "upsellId"), value(formData, "status"));
  revalidatePath("/clientes");
  revalidatePath("/receitas");
}

export async function refreshCustomerHealthAction(formData: FormData) {
  if (demoMode()) return;
  const actor = await getCurrentActor();
  await refreshCustomerHealth(actor, value(formData, "companyId"));
  revalidatePath("/clientes");
}
