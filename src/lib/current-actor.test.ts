import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.stubEnv("DEMO_MODE", "false");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna actor quando sessionVersion bate com o banco e usa role atual da membership", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      organizationName: "Nome antigo",
      role: "OWNER",
      sessionVersion: 3,
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "MANAGER",
      organization: { active: true, name: "Organização atual" },
      user: { active: true, sessionVersion: 3 },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).resolves.toEqual({
      userId: "user-1",
      organizationId: "org-1",
      organizationName: "Organização atual",
      role: "MANAGER",
    });
  });

  it("nega JWT revogado quando sessionVersion está desatualizado", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      role: "OWNER",
      sessionVersion: 2,
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "OWNER",
      organization: { active: true, name: "Org" },
      user: { active: true, sessionVersion: 3 },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });

  it("nega JWT legado sem sessionVersion", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      role: "OWNER",
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "OWNER",
      organization: { active: true, name: "Org" },
      user: { active: true, sessionVersion: 1 },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });

  it("nega sessão sem user id", async () => {
    mocks.auth.mockResolvedValue({ organizationId: "org-1", sessionVersion: 1 });
    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
    expect(mocks.findMembership).not.toHaveBeenCalled();
  });

  it("nega sessão cuja membership deixou de estar ativa", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      role: "OWNER",
      sessionVersion: 1,
    });
    mocks.findMembership.mockResolvedValue(null);

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });

  it("nega user inativo", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      sessionVersion: 1,
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "OWNER",
      organization: { active: true, name: "Org" },
      user: { active: false, sessionVersion: 1 },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });

  it("nega organization inativa", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      sessionVersion: 1,
    });
    mocks.findMembership.mockResolvedValue({
      organizationId: "org-1",
      role: "OWNER",
      organization: { active: false, name: "Org" },
      user: { active: true, sessionVersion: 1 },
    });

    const { getCurrentActor } = await import("./current-actor");
    await expect(getCurrentActor()).rejects.toThrow("redirect:/login");
  });

  it("resolveCurrentActor retorna null sem redirecionar para boundaries de API", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1" },
      organizationId: "org-1",
      sessionVersion: 1,
    });
    mocks.findMembership.mockResolvedValue(null);

    const { resolveCurrentActor } = await import("./current-actor");
    await expect(resolveCurrentActor()).resolves.toBeNull();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
