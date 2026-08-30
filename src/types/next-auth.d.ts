import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/modules/shared/tenant";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
    organizationId?: string;
    organizationName?: string;
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    organizationName?: string;
    role?: AppRole;
  }
}
