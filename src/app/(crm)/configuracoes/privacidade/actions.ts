"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/current-actor";
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
    value(formData, "status") as "IN_PROGRESS",
    value(formData, "resolution"),
  );
  revalidatePath("/configuracoes/privacidade");
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
