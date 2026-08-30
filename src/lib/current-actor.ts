import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { TenantActor } from "@/modules/shared/tenant";

export async function getCurrentActor(): Promise<TenantActor> {
  if (process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production") {
    return {
      userId: "demo-user",
      organizationId: "demo-org",
      organizationName: "Tupiniquim Tech",
      role: "OWNER",
    };
  }

  const session = await auth();
  if (!session?.user?.id || !session.organizationId || !session.role) redirect("/login");
  return {
    userId: session.user.id,
    organizationId: session.organizationId,
    organizationName: session.organizationName ?? "Organização",
    role: session.role,
  };
}
