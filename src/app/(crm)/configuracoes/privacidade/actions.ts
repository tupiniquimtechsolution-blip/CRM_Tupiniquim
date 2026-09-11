"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/current-actor";
import { CORRECTION_PREVIEW_COOKIE, executeCorrection, previewCorrection } from "@/modules/privacy/correction";
import { createPrivacyRequest, createSecurityIncident, saveRetentionPolicy, updatePrivacyRequest } from "@/modules/privacy/service";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function createPrivacyRequestAction(formData: FormData) {
  await createPrivacyRequest(await getCurrentActor(), {
    type: value(formData, "type") as "CONFIRMATION_ACCESS",
    subjectEmail: value(formData, "subjectEmail"),
    subjectName: value(formData, "subjectName"),
    details: value(formData, "details"),
  });
  revalidatePath("/configuracoes/privacidade");
}

export async function updatePrivacyRequestAction(formData: FormData) {
  await updatePrivacyRequest(
    await getCurrentActor(),
    value(formData, "requestId"),
    value(formData, "status") as "IDENTITY_VERIFICATION" | "IN_PROGRESS" | "COMPLETED" | "DENIED",
    value(formData, "resolution"),
  );
  revalidatePath("/configuracoes/privacidade");
}

export async function openPrivacyPreviewAction(formData: FormData) {
  await getCurrentActor();
  const requestId = value(formData, "requestId");
  if (!requestId) throw new Error("Solicitação inválida.");
  redirect(`/configuracoes/privacidade/${encodeURIComponent(requestId)}/preview`);
}

export async function openCorrectionAction(formData: FormData) {
  await getCurrentActor();
  const requestId = value(formData, "requestId");
  if (!requestId) throw new Error("Solicitação inválida.");
  redirect(`/configuracoes/privacidade/${encodeURIComponent(requestId)}/correction`);
}

export async function createCorrectionPreviewAction(formData: FormData) {
  const actor = await getCurrentActor();
  const requestId = value(formData, "requestId");
  const preview = await previewCorrection(actor, requestId, {
    entityType: value(formData, "entityType"),
    entityId: value(formData, "entityId"),
    name: value(formData, "name"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
  });
  const cookieStore = await cookies();
  cookieStore.set(CORRECTION_PREVIEW_COOKIE, preview.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.CI !== "true",
    path: "/configuracoes/privacidade",
    maxAge: 15 * 60,
    priority: "high",
  });
  redirect(`/configuracoes/privacidade/${encodeURIComponent(requestId)}/correction/preview`);
}

export async function executeCorrectionAction(formData: FormData) {
  const actor = await getCurrentActor();
  const requestId = value(formData, "requestId");
  const cookieStore = await cookies();
  const token = cookieStore.get(CORRECTION_PREVIEW_COOKIE)?.value;
  if (!token) throw new Error("Preview de correção ausente ou expirado.");
  await executeCorrection(actor, requestId, token);
  cookieStore.set(CORRECTION_PREVIEW_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.CI !== "true",
    path: "/configuracoes/privacidade",
    maxAge: 0,
  });
  revalidatePath("/configuracoes/privacidade");
  redirect("/configuracoes/privacidade");
}

export async function saveRetentionPolicyAction(formData: FormData) {
  await saveRetentionPolicy(await getCurrentActor(), {
    commercialDataDays: value(formData, "commercialDataDays"),
    captureSubmissionDays: value(formData, "captureSubmissionDays"),
    reportExportDays: value(formData, "reportExportDays"),
    aiRequestDays: value(formData, "aiRequestDays"),
    auditLogDays: value(formData, "auditLogDays"),
    incidentLogDays: value(formData, "incidentLogDays"),
  });
  revalidatePath("/configuracoes/privacidade");
}

export async function createSecurityIncidentAction(formData: FormData) {
  await createSecurityIncident(await getCurrentActor(), {
    title: value(formData, "title"),
    summary: value(formData, "summary"),
    severity: value(formData, "severity") as "LOW",
    personalDataInvolved: formData.get("personalDataInvolved") === "on",
    relevantRisk: formData.get("relevantRisk") === "on",
  });
  revalidatePath("/configuracoes/privacidade");
}
