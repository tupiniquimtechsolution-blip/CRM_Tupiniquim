import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const passwordSchema = z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function requestPasswordReset(email: string) {
  const normalized = z.string().email().parse(email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized }, include: { memberships: { where: { status: "ACTIVE" }, take: 1 } } });
  if (!user?.active) return { accepted: true as const };
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, organizationId: user.memberships[0]?.organizationId, tokenHash: digest(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
  return { accepted: true as const, ...(process.env.NODE_ENV !== "production" ? { developmentToken: token } : {}) };
}

export async function resetPassword(token: string, password: string) {
  const validPassword = passwordSchema.parse(password);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: digest(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) throw new Error("Token de recuperação inválido ou expirado.");
  const passwordHash = await hash(validPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}
