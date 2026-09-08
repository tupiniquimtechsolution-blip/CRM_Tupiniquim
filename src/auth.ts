import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/modules/security/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const configuredLimit = Number(process.env.AUTH_RATE_LIMIT_MAX || 10);
        const rateLimit = await consumeRateLimit({ scope: "auth:email", identifier: parsed.data.email, limit: Number.isFinite(configuredLimit) ? Math.max(5, Math.min(100, configuredLimit)) : 10, windowMs: 15 * 60_000 });
        if (!rateLimit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash || !user.active) return null;

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id, status: "ACTIVE", organization: { active: true } },
          include: { organization: true, user: { select: { sessionVersion: true } } },
          orderBy: { createdAt: "asc" },
        });
        token.organizationId = membership?.organizationId;
        token.organizationName = membership?.organization.name;
        token.role = membership?.role;
        token.sessionVersion = membership?.user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      session.organizationId = typeof token.organizationId === "string" ? token.organizationId : undefined;
      session.organizationName = typeof token.organizationName === "string" ? token.organizationName : undefined;
      session.role = ["OWNER", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"].includes(String(token.role))
        ? token.role as "OWNER" | "ADMIN" | "MANAGER" | "SALES" | "SUPPORT" | "VIEWER"
        : undefined;
      session.sessionVersion = typeof token.sessionVersion === "number" ? token.sessionVersion : undefined;
      return session;
    },
  },
});
