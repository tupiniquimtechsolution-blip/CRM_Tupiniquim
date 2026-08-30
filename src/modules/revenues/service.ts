import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";

export const revenueSchema = z.object({
  companyId: z.string().min(1),
  opportunityId: z.string().optional(),
  contractId: z.string().optional(),
  type: z.enum(["MRR", "PROJECT", "UPSELL"]),
  description: z.string().trim().min(3),
  amount: z.coerce.number().positive(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
});

export async function listRevenues(actor: TenantActor) {
  assertPermission(actor, "reports:read");
  return prisma.revenue.findMany({
    where: tenantWhere(actor),
    include: { company: true, contract: true },
    orderBy: { startsAt: "desc" },
  });
}

export async function createRevenue(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "crm:write");
  const data = revenueSchema.parse(raw);
  const company = await prisma.company.findFirst({ where: { id: data.companyId, organizationId: actor.organizationId } });
  if (!company) throw new Error("Empresa inválida para a organização ativa.");
  return prisma.revenue.create({
    data: {
      ...data,
      opportunityId: data.opportunityId || null,
      contractId: data.contractId || null,
      organizationId: actor.organizationId,
      status: "ACTIVE",
    },
  });
}

export async function revenueSummary(actor: TenantActor) {
  assertPermission(actor, "reports:read");
  const rows = await prisma.revenue.groupBy({
    by: ["type"],
    where: { organizationId: actor.organizationId, status: "ACTIVE" },
    _sum: { amount: true },
  });
  return Object.fromEntries(rows.map((row) => [row.type, Number(row._sum.amount ?? 0)]));
}
