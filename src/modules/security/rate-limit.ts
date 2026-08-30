import { createHmac } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type RateLimitRow = { hits: number; expiresAt: Date };

function securitySecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET é obrigatório para os controles de segurança.");
  }
  return "crm-tupiniquim-local-development-only";
}

export function digestSecurityIdentifier(scope: string, identifier: string) {
  return createHmac("sha256", securitySecret())
    .update(`${scope}:${identifier.trim().toLocaleLowerCase()}`)
    .digest("hex");
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  const agent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";
  return digestSecurityIdentifier("request", `${address}:${agent}`);
}

export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + input.windowMs);
  const key = digestSecurityIdentifier(input.scope, input.identifier);
  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "hits", "windowStartedAt", "expiresAt", "updatedAt")
    VALUES (${key}, 1, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "hits" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."hits" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowStartedAt"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "hits", "expiresAt"
  `);
  const state = rows[0];
  if (!state) throw new Error("Não foi possível avaliar o limite de requisições.");
  return {
    allowed: state.hits <= input.limit,
    remaining: Math.max(0, input.limit - state.hits),
    retryAfterSeconds: Math.max(1, Math.ceil((state.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function purgeExpiredRateLimitBuckets(now = new Date()) {
  return prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } });
}
