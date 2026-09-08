import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const MAX_RECORDS_PER_CATEGORY = 1_000;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function bounded<T>(label: string, rows: T[]) {
  if (rows.length > MAX_RECORDS_PER_CATEGORY) {
    throw new Error(`A categoria ${label} excede o limite seguro de ${MAX_RECORDS_PER_CATEGORY} registros. Revise manualmente.`);
  }
  return rows;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function byId<T extends { id: string }>(rows: T[]) {
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export async function collectPrivacySubjectData(organizationId: string, email: string) {
  const subjectEmail = normalizeEmail(email);
  const [contactsRaw, companiesRaw, capturesRaw, consentsRaw, requestsRaw] = await Promise.all([
    prisma.contact.findMany({
      where: { organizationId, email: { equals: subjectEmail, mode: "insensitive" } },
      select: { id: true, companyId: true, name: true, email: true, phone: true, position: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.company.findMany({
      where: { organizationId, email: { equals: subjectEmail, mode: "insensitive" } },
      select: { id: true, name: true, tradeName: true, email: true, phone: true, lifecycle: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.captureSubmission.findMany({
      where: { organizationId, payload: { path: ["email"], equals: subjectEmail } },
      select: { id: true, payload: true, status: true, leadId: true, legalBasis: true, purpose: true, consentAt: true, noticeVersion: true, receivedAt: true, processedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.privacyConsent.findMany({
      where: { organizationId, subjectEmail: { equals: subjectEmail, mode: "insensitive" } },
      select: { id: true, subjectType: true, subjectId: true, purpose: true, legalBasis: true, status: true, source: true, noticeVersion: true, collectedAt: true, revokedAt: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.privacyRequest.findMany({
      where: { organizationId, subjectEmail: { equals: subjectEmail, mode: "insensitive" } },
      select: { id: true, protocol: true, type: true, status: true, subjectName: true, requestedAt: true, dueAt: true, completedAt: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
  ]);

  const contacts = bounded("contacts", contactsRaw);
  const companies = bounded("companies", companiesRaw);
  const captures = bounded("captureSubmissions", capturesRaw);
  const consents = bounded("privacyConsents", consentsRaw);
  const requests = bounded("privacyRequests", requestsRaw);
  const leadIds = [...new Set(captures.map((item) => item.leadId).filter((value): value is string => Boolean(value)))];

  const [leadsRaw, activitiesRaw, aiRaw] = leadIds.length ? await Promise.all([
    prisma.lead.findMany({
      where: { organizationId, id: { in: leadIds } },
      select: { id: true, companyId: true, source: true, validationSource: true, status: true, score: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.activity.findMany({
      where: { organizationId, leadId: { in: leadIds } },
      select: { id: true, leadId: true, type: true, status: true, dueAt: true, completedAt: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
    prisma.aiAssistRequest.findMany({
      where: { organizationId, entityType: "Lead", entityId: { in: leadIds } },
      select: { id: true, entityId: true, kind: true, provider: true, model: true, status: true, reviewedAt: true, createdAt: true, updatedAt: true },
      take: MAX_RECORDS_PER_CATEGORY + 1,
    }),
  ]) : [[], [], []];

  const leads = bounded("leads", leadsRaw);
  const activities = bounded("activities", activitiesRaw);
  const aiRequests = bounded("aiAssistRequests", aiRaw);

  return {
    subjectEmail,
    contacts: byId(contacts.map((row) => ({ ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    companies: byId(companies.map((row) => ({ ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    captureSubmissions: byId(captures.map((row) => {
      const payload = jsonRecord(row.payload);
      return {
        id: row.id,
        leadId: row.leadId,
        status: row.status,
        legalBasis: row.legalBasis,
        purpose: row.purpose,
        consentAt: iso(row.consentAt),
        noticeVersion: row.noticeVersion,
        receivedAt: iso(row.receivedAt),
        processedAt: iso(row.processedAt),
        submittedIdentity: {
          contactName: optionalText(payload.contactName),
          companyName: optionalText(payload.companyName),
          email: optionalText(payload.email),
          phone: optionalText(payload.phone),
        },
      };
    })),
    privacyConsents: byId(consents.map((row) => ({ ...row, collectedAt: iso(row.collectedAt), revokedAt: iso(row.revokedAt), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    privacyRequests: byId(requests.map((row) => ({ ...row, requestedAt: iso(row.requestedAt), dueAt: iso(row.dueAt), completedAt: iso(row.completedAt), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    leads: byId(leads.map((row) => ({ ...row, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    activities: byId(activities.map((row) => ({ ...row, dueAt: iso(row.dueAt), completedAt: iso(row.completedAt), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
    aiAssistRequests: byId(aiRequests.map((row) => ({ ...row, reviewedAt: iso(row.reviewedAt), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) }))),
  };
}

export type PrivacySubjectData = Awaited<ReturnType<typeof collectPrivacySubjectData>>;

export function privacySubjectCounts(data: PrivacySubjectData) {
  return {
    contacts: data.contacts.length,
    companies: data.companies.length,
    captureSubmissions: data.captureSubmissions.length,
    privacyConsents: data.privacyConsents.length,
    privacyRequests: data.privacyRequests.length,
    leads: data.leads.length,
    activities: data.activities.length,
    aiAssistRequests: data.aiAssistRequests.length,
  };
}

export function privacySubjectDigest(data: PrivacySubjectData) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
