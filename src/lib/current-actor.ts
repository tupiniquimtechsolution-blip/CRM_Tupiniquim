import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { TenantActor } from "@/modules/shared/tenant";

export async function resolveCurrentActor(): Promise<TenantActor | null> {
  if (process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production") {
    return {
      userId: "demo-user",
      organizationId: "demo-org",
      organizationName: "Tupiniquim Tech",
      role: "OWNER",
    };
  }

  const session = await auth();
  if (!session?.user?.id || !session.organizationId) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: session.organizationId,
      status: "ACTIVE",
    },
    include: {
      organization: true,
      user: { select: { active: true, sessionVersion: true } },
    },
  });

  if (!membership?.user.active || !membership.organization.active) return null;
  if (
    typeof session.sessionVersion !== "number" ||
    session.sessionVersion !== membership.user.sessionVersion
  ) {
    return null;
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}

export async function getCurrentActor(): Promise<TenantActor> {
  const actor = await resolveCurrentActor();
  if (!actor) redirect("/login");
  return actor;
}
