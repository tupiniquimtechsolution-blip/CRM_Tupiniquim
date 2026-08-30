import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";

const productSchema = z.object({ name: z.string().trim().min(2), description: z.string().trim().optional(), sku: z.string().trim().optional(), price: z.coerce.number().nonnegative(), recurring: z.boolean().default(false) });

export async function listProducts(actor: TenantActor) {
  assertPermission(actor, "crm:read");
  return prisma.product.findMany({ where: { ...tenantWhere(actor), active: true }, orderBy: { name: "asc" } });
}

export async function createProduct(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "crm:write");
  const data = productSchema.parse(raw);
  return prisma.product.create({ data: { ...data, sku: data.sku || null, description: data.description || null, organizationId: actor.organizationId } });
}
