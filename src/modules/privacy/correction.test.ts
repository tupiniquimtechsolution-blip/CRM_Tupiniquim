import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }));

import { calculateCorrectionChanges, correctionInputSchema, verifyCorrectionPreviewToken } from "./correction";

describe("privacy correction domain", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-only-auth-secret-32-characters");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aceita somente campos allowlisted", () => {
    expect(() => correctionInputSchema.parse({
      entityType: "Contact",
      entityId: "contact-1",
      name: "Pessoa Corrigida",
      email: "pessoa@example.com",
      phone: "11999990000",
      organizationId: "other-org",
    })).toThrow();
  });

  it("normaliza email e vazio opcional sem mass assignment", () => {
    expect(correctionInputSchema.parse({
      entityType: "Contact",
      entityId: "contact-1",
      name: "Pessoa Corrigida",
      email: "Pessoa@Example.com",
      phone: "",
    })).toEqual({
      entityType: "Contact",
      entityId: "contact-1",
      name: "Pessoa Corrigida",
      email: "pessoa@example.com",
      phone: null,
    });
  });

  it("calcula somente mudanças reais", () => {
    expect(calculateCorrectionChanges(
      { name: "Pessoa", email: "pessoa@example.com", phone: null },
      { name: "Pessoa Corrigida", email: "pessoa@example.com", phone: null },
    )).toEqual({ name: "Pessoa Corrigida" });
  });

  it("rejeita token de preview inválido", () => {
    expect(() => verifyCorrectionPreviewToken("invalid.preview", Date.now())).toThrow("Preview de correção inválido ou expirado.");
  });
});
