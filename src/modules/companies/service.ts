import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { companySchema, type CompanyInput } from "./schema";

export async function listCompanies(actor: TenantActor, query?: string) {
  assertPermission(actor, "crm:read");
  return prisma.company.findMany({
    where: {
      ...tenantWhere(actor),
      ...(query
        ? { OR: [{ name: { contains: query, mode: "insensitive" } }, { document: { contains: query } }] }
        : {}),
    },
    include: { contacts: true, tags: { include: { tag: true } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function createCompany(actor: TenantActor, input: CompanyInput) {
  assertPermission(actor, "crm:write");
  const data = companySchema.parse(input);
  const company = await prisma.company.create({
    data: {
      organizationId: actor.organizationId,
      ownerId: actor.userId,
      name: data.name,
      tradeName: data.tradeName || null,
      document: data.document || null,
      website: data.website || null,
      phone: data.phone || null,
      email: data.email || null,
      segment: data.segment,
      source: data.source,
    },
  });
  await recordAudit(actor, { action: "company.created", entityType: "Company", entityId: company.id, after: { name: company.name, lifecycle: company.lifecycle } });
  return company;
}
