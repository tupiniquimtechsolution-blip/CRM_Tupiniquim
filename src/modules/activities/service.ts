import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";

export const activitySchema = z.object({
  title: z.string().trim().min(3),
  type: z.enum(["TASK", "CALL", "EMAIL", "MEETING", "FOLLOW_UP"]),
  dueAt: z.coerce.date(),
  companyId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  assignedToId: z.string().optional(),
  description: z.string().trim().optional(),
});

export async function listActivities(actor: TenantActor) {
  assertPermission(actor, "crm:read");
  return prisma.activity.findMany({
    where: tenantWhere(actor),
    include: { company: true, opportunity: true, assignedTo: true },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 100,
  });
}

export async function createActivity(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "crm:write");
  const data = activitySchema.parse(raw);
  return prisma.activity.create({
    data: {
      ...data,
      organizationId: actor.organizationId,
      createdById: actor.userId,
      assignedToId: data.assignedToId || actor.userId,
    },
  });
}

export async function completeActivity(actor: TenantActor, activityId: string) {
  assertPermission(actor, "activity:write");
  return prisma.activity.updateMany({
    where: { id: activityId, organizationId: actor.organizationId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function createDueNotifications(actor: TenantActor, now = new Date()) {
  assertPermission(actor, "crm:write");
  const due = await prisma.activity.findMany({
    where: { organizationId: actor.organizationId, status: "OPEN", dueAt: { lte: now }, assignedToId: { not: null } },
    select: { id: true, title: true, assignedToId: true },
  });
  if (!due.length) return { count: 0 };
  await prisma.notification.createMany({
    data: due.map((activity) => ({
      organizationId: actor.organizationId,
      userId: activity.assignedToId!,
      type: "FOLLOW_UP_DUE" as const,
      title: `Follow-up vencido: ${activity.title}`,
      body: `Atividade ${activity.id} requer atenção.`,
    })),
    skipDuplicates: true,
  });
  return { count: due.length };
}
