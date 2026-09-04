import { prisma } from "@/lib/db";
import { dispatchAutomationEvent } from "@/modules/automations/service";
import { stableKey } from "@/modules/automations/domain";
import { createHash } from "node:crypto";

type CapturePayload = {
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  interest: string;
  privacyConsent: true;
  privacyNoticeVersion: string;
};

export class CaptureInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaptureInputError";
  }
}

function clean(raw: Record<string, unknown>): CapturePayload {
  const value = (key: string) => String(raw[key] ?? "").trim();
  const consent = ["on", "true", "1", "yes"].includes(value("privacyConsent").toLocaleLowerCase());
  const result = {
    contactName: value("contactName"),
    companyName: value("companyName"),
    email: value("email").toLocaleLowerCase(),
    phone: value("phone"),
    interest: value("interest"),
    privacyConsent: consent as true,
    privacyNoticeVersion: value("privacyNoticeVersion"),
  };

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email);
  if (
    result.contactName.length < 2 || result.contactName.length > 120 ||
    result.companyName.length < 2 || result.companyName.length > 160 ||
    !validEmail || result.email.length > 254 ||
    result.phone.length > 40 ||
    result.interest.length < 3 || result.interest.length > 2_000
  ) {
    throw new CaptureInputError("Dados obrigatórios do formulário estão inválidos.");
  }
  if (!consent || !/^\d{4}-\d{2}$/.test(result.privacyNoticeVersion)) {
    throw new CaptureInputError("É necessário aceitar o aviso de privacidade vigente.");
  }
  return result;
}

export async function processCaptureSubmission(publicId: string, eventKey: string, raw: Record<string, unknown>, requesterHash?: string) {
  const form = await prisma.captureForm.findFirst({ where: { publicId, active: true } });
  if (!form) throw new CaptureInputError("Formulário de captura indisponível.");

  const payload = clean(raw);
  let submission;
  try {
    submission = await prisma.captureSubmission.create({
      data: {
        organizationId: form.organizationId,
        formId: form.id,
        eventKey,
        payload: {
          contactName: payload.contactName,
          companyName: payload.companyName,
          email: payload.email,
          phone: payload.phone,
          interest: payload.interest,
        },
        legalBasis: "CONSENT",
        purpose: "Atendimento comercial solicitado",
        consentAt: new Date(),
        noticeVersion: payload.privacyNoticeVersion,
        requesterHash: requesterHash ?? null,
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const existing = await prisma.captureSubmission.findUnique({ where: { formId_eventKey: { formId: form.id, eventKey } } });
    if (!existing) throw error;
    return { submission: existing, duplicate: true };
  }

  try {
    const converted = await prisma.$transaction(async (tx) => {
      let company = await tx.company.findFirst({
        where: { organizationId: form.organizationId, name: { equals: payload.companyName, mode: "insensitive" } },
      });
      company ??= await tx.company.create({
        data: {
          organizationId: form.organizationId,
          name: payload.companyName,
          email: payload.email,
          phone: payload.phone || null,
          source: form.source,
          lifecycle: "LEAD",
        },
      });
      let contact = await tx.contact.findFirst({
        where: { organizationId: form.organizationId, companyId: company.id, email: payload.email },
      });
      contact ??= await tx.contact.create({
        data: {
          organizationId: form.organizationId,
          companyId: company.id,
          name: payload.contactName,
          email: payload.email,
          phone: payload.phone || null,
        },
      });
      const lead = await tx.lead.create({
        data: {
          organizationId: form.organizationId,
          companyId: company.id,
          title: payload.interest,
          source: form.source,
          validationSource: "FORMULARIO_PUBLICO",
          status: "PENDING_VALIDATION",
          notes: `Contato: ${contact.name}`,
        },
      });
      await tx.privacyConsent.create({
        data: {
          organizationId: form.organizationId,
          subjectType: "Contact",
          subjectId: contact.id,
          subjectEmail: payload.email,
          purpose: "Atendimento comercial solicitado",
          legalBasis: "CONSENT",
          status: "GRANTED",
          source: form.source,
          noticeVersion: payload.privacyNoticeVersion,
          evidenceDigest: createHash("sha256").update(`${form.id}:${eventKey}:${payload.email}:${payload.privacyNoticeVersion}`).digest("hex"),
          collectedAt: new Date(),
        },
      });
      const updated = await tx.captureSubmission.update({
        where: { id: submission.id },
        data: { status: "CONVERTED", leadId: lead.id, processedAt: new Date() },
      });
      return { submission: updated, company, contact, lead };
    });

    await dispatchAutomationEvent({
      organizationId: form.organizationId,
      triggerType: "CAPTURE_FORM_SUBMITTED",
      eventKey: stableKey("capture", form.id, eventKey),
      payload: {
        submissionId: converted.submission.id,
        companyId: converted.company.id,
        leadId: converted.lead.id,
        contact: { id: converted.contact.id, email: converted.contact.email, phone: converted.contact.phone },
        source: form.source,
      },
    });
    return { submission: converted.submission, duplicate: false };
  } catch (error) {
    await prisma.captureSubmission.update({
      where: { id: submission.id },
      data: { status: "REJECTED", processedAt: new Date() },
    });
    throw error;
  }
}
