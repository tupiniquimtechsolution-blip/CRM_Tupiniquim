import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  findUser: vi.fn(),
  updateMany: vi.fn(),
  createToken: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/modules/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUser, update: vi.fn() },
    passwordResetToken: {
      updateMany: mocks.updateMany,
      create: mocks.createToken,
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: { deleteMany: vi.fn() },
    $transaction: mocks.transaction,
  },
}));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 60 });
    mocks.updateMany.mockReturnValue({ op: "revoke-old" });
    mocks.createToken.mockReturnValue({ op: "create-new" });
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
});
