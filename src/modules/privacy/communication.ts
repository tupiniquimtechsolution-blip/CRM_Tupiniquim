import { z } from "zod";
import { prisma } from "@/lib/db";

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export async function outboundPrivacyDecision(input: {
  organizationId: string;
  provider: "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK";
  recipient: string;
}) {
  if (input.provider !== "EMAIL") {
    return { allowed: true as const, reason: "recipient-not-email" as const };
  }

  const parsed = emailSchema.safeParse(input.recipient);
  if (!parsed.success) return { allowed: true as const, reason: "recipient-not-email" as const };
  const subjectEmail = parsed.data;

  const [opposition, revokedConsent] = await Promise.all([
    prisma.privacyRequest.findFirst({
      where: {
        organizationId: input.organizationId,
        type: "OPPOSITION",
        status: "COMPLETED",
        subjectEmail: { equals: subjectEmail, mode: "insensitive" },
      },
      select: { id: true },
    }),
    prisma.privacyConsent.findFirst({
      where: {
        organizationId: input.organizationId,
        subjectEmail: { equals: subjectEmail, mode: "insensitive" },
        status: "REVOKED",
      },
      select: { id: true },
    }),
  ]);

  if (opposition) return { allowed: false as const, reason: "opposition" as const };
  if (revokedConsent) return { allowed: false as const, reason: "revoked-consent" as const };
  return { allowed: true as const, reason: "no-blocking-preference" as const };
}

export async function assertOutboundPrivacyAllowed(input: {
  organizationId: string;
  provider: "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK";
  recipient: string;
}) {
  const decision = await outboundPrivacyDecision(input);
  if (!decision.allowed) throw new Error("Saída por e-mail bloqueada por preferência de privacidade registrada.");
  return decision;
}
