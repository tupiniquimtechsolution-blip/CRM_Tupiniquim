import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  findUser: vi.fn(),
  updateUser: vi.fn(),
  updateMany: vi.fn(),
  createToken: vi.fn(),
  findResetToken: vi.fn(),
  updateResetToken: vi.fn(),
  deleteSessions: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/modules/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUser, update: mocks.updateUser },
    passwordResetToken: {
      updateMany: mocks.updateMany,
      create: mocks.createToken,
      findUnique: mocks.findResetToken,
      update: mocks.updateResetToken,
    },
    session: { deleteMany: mocks.deleteSessions },
    $transaction: mocks.transaction,
  },
}));

describe("password recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 60 });
    mocks.updateMany.mockReturnValue({ op: "revoke-old" });
    mocks.createToken.mockReturnValue({ op: "create-new" });
    mocks.updateUser.mockReturnValue({ op: "update-user" });
    mocks.updateResetToken.mockReturnValue({ op: "use-token" });
    mocks.deleteSessions.mockReturnValue({ op: "delete-sessions" });
    mocks.transaction.mockResolvedValue([]);
  });

  it("responde de forma genérica e não consulta usuário quando o rate limit bloqueia", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60 });
    const { requestPasswordReset } = await import("./recovery");

    await expect(requestPasswordReset("Pessoa@Exemplo.com")).resolves.toEqual({ accepted: true });
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("invalida tokens ativos anteriores antes de criar um novo", async () => {
    mocks.findUser.mockResolvedValue({
      id: "user-1",
      active: true,
      memberships: [{ organizationId: "org-1" }],
    });
    const { requestPasswordReset } = await import("./recovery");

    const result = await requestPasswordReset("pessoa@example.com");
    expect(result.accepted).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "user-1", usedAt: null }),
    }));
    expect(mocks.createToken).toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("incrementa sessionVersion na mesma transação que atualiza passwordHash", async () => {
    mocks.findResetToken.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { resetPassword } = await import("./recovery");

    await resetPassword("valid-reset-token", "SenhaSegura123");

    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        passwordHash: expect.any(String),
        sessionVersion: { increment: 1 },
      },
    });
    expect(mocks.updateResetToken).toHaveBeenCalledWith({
      where: { id: "reset-1" },
      data: { usedAt: expect.any(Date) },
    });
    expect(mocks.deleteSessions).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mocks.transaction).toHaveBeenCalledWith([
      { op: "update-user" },
      { op: "use-token" },
      { op: "delete-sessions" },
    ]);
  });

  it("rejeita token expirado", async () => {
    mocks.findResetToken.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1),
    });
    const { resetPassword } = await import("./recovery");
    await expect(resetPassword("expired-token", "SenhaSegura123")).rejects.toThrow("Token de recuperação inválido ou expirado.");
  });

  it("rejeita token já usado", async () => {
    mocks.findResetToken.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { resetPassword } = await import("./recovery");
    await expect(resetPassword("used-token", "SenhaSegura123")).rejects.toThrow("Token de recuperação inválido ou expirado.");
  });

  it("rejeita token inexistente", async () => {
    mocks.findResetToken.mockResolvedValue(null);
    const { resetPassword } = await import("./recovery");
    await expect(resetPassword("missing-token", "SenhaSegura123")).rejects.toThrow("Token de recuperação inválido ou expirado.");
  });
});
