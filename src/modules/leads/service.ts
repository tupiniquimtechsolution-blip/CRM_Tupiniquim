import Papa from "papaparse";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { importLeadRowSchema, leadSchema, type LeadInput } from "./schema";

export async function listLeads(actor: TenantActor) {
  assertPermission(actor, "crm:read");
  return prisma.lead.findMany({
    where: tenantWhere(actor),
    include: { company: true, assignedTo: true, tags: { include: { tag: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });
}

export async function createLead(actor: TenantActor, input: LeadInput) {
  assertPermission(actor, "crm:write");
  const data = leadSchema.parse(input);
  const company = await prisma.company.findFirst({
    where: { id: data.companyId, organizationId: actor.organizationId },
    select: { id: true },
  });
  if (!company) throw new Error("Empresa não encontrada na organização ativa.");

  const lead = await prisma.lead.create({
    data: {
      organizationId: actor.organizationId,
      companyId: company.id,
      assignedToId: data.assignedToId || null,
      title: data.title,
      source: data.source,
      validationSource: data.validationSource,
      score: data.score,
      notes: data.notes || null,
      status: "VALIDATED",
    },
  });
  await recordAudit(actor, { action: "lead.created", entityType: "Lead", entityId: lead.id, after: { companyId: lead.companyId, status: lead.status, source: lead.source } });
  return lead;
}

export function previewLeadCsv(csv: string) {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return parsed.data.map((row, index) => {
    const result = importLeadRowSchema.safeParse(row);
    return result.success
      ? { row: index + 2, valid: true as const, data: result.data, errors: [] }
      : { row: index + 2, valid: false as const, data: row, errors: result.error.issues.map((issue) => issue.message) };
  });
}
