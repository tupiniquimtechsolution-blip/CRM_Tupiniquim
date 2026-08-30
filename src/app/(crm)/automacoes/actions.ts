"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/current-actor";
import { createAutomation, publishAutomation, retryAutomationRun } from "@/modules/automations/service";
import { createCaptureForm, createMessageTemplate, createSandboxConnection, createWebhookEndpoint, reviewMessageTemplate, reviewOutboundApproval } from "@/modules/integrations/service";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createAutomationPresetAction(formData: FormData) {
  const actor = await getCurrentActor();
  const actionType = value(formData, "actionType");
  const action = actionType === "CREATE_NOTIFICATION"
    ? { type: "CREATE_NOTIFICATION" as const, title: value(formData, "actionTitle"), body: "Gerada automaticamente pelo CRM." }
    : { type: "CREATE_TASK" as const, title: value(formData, "actionTitle"), dueInHours: Number(value(formData, "dueInHours") || 24) };
  const conditionField = value(formData, "conditionField");
  await createAutomation(actor, {
    name: value(formData, "name"),
    description: value(formData, "description"),
    triggerType: value(formData, "triggerType"),
    triggerConfig: {},
    conditions: conditionField ? [{ field: conditionField, operator: "EQUALS", value: value(formData, "conditionValue") }] : [],
    actions: [action],
  });
  revalidatePath("/automacoes");
}

export async function publishAutomationAction(formData: FormData) {
  await publishAutomation(await getCurrentActor(), value(formData, "automationId"));
  revalidatePath("/automacoes");
}

export async function retryAutomationAction(formData: FormData) {
  await retryAutomationRun(await getCurrentActor(), value(formData, "runId"));
  revalidatePath("/automacoes");
}

export async function createSandboxConnectionAction(formData: FormData) {
  await createSandboxConnection(await getCurrentActor(), value(formData, "provider") as "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK", value(formData, "name"));
  revalidatePath("/automacoes");
}

export async function createTemplateAction(formData: FormData) {
  await createMessageTemplate(await getCurrentActor(), { provider: value(formData, "provider") as "EMAIL" | "WHATSAPP", name: value(formData, "name"), subject: value(formData, "subject"), body: value(formData, "body") });
  revalidatePath("/automacoes");
}

export async function reviewTemplateAction(formData: FormData) {
  await reviewMessageTemplate(await getCurrentActor(), value(formData, "templateId"), value(formData, "decision") === "APPROVE");
  revalidatePath("/automacoes");
}

export async function reviewOutboundAction(formData: FormData) {
  await reviewOutboundApproval(await getCurrentActor(), value(formData, "approvalId"), value(formData, "decision") === "APPROVE");
  revalidatePath("/automacoes");
}

export async function createCaptureFormAction(formData: FormData) {
  await createCaptureForm(await getCurrentActor(), { name: value(formData, "name"), description: value(formData, "description"), source: value(formData, "source") });
  revalidatePath("/automacoes");
}

export type WebhookCreateState = { token?: string; publicId?: string; error?: string };

export async function createWebhookEndpointAction(_state: WebhookCreateState, formData: FormData): Promise<WebhookCreateState> {
  try {
    const result = await createWebhookEndpoint(await getCurrentActor(), value(formData, "name"));
    revalidatePath("/automacoes");
    return { token: result.token, publicId: result.endpoint.publicId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao criar webhook." };
  }
}
