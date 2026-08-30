import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { TenantActor } from "@/modules/shared/tenant";

export async function recordAudit(
  actor: TenantActor,
  event: { action: string; entityType: string; entityId: string; before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue },
) {
  await prisma.auditLog.create({
    data: {
      organizationId: actor.organizationId,
      actorId: actor.userId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      before: event.before,
      after: event.after,
    },
  });
}
