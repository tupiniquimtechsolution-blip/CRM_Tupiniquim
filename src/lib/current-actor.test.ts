import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMembership: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { membership: { findFirst: mocks.findMembership } },
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

describe("getCurrentActor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_MODE = "false";
    process.env.NODE_ENV = "test";
  });

  it("usa membership ativa do banco como fonte atual de role e organização", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      organizationName: "Nome antigo",
      role: "OWNER",
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "MANAGER",
      organization: { active: true, name: "Organização atual" },
      user: { active: true },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).resolves.toEqual({
      userId: "user-1",
      organizationId: "org-1",
      organizationName: "Organização atual",
      role: "MANAGER",
    });
  });

  it("nega sessão cuja membership deixou de estar ativa", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      role: "OWNER",
    });
    mocks.findMembership.mockResolvedValue(null);

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });
});
