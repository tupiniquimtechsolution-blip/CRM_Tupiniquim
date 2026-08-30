import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

describe("identificadores de segurança", () => {
  it("pseudonimiza o identificador sem expor o valor original", async () => {
    const { digestSecurityIdentifier } = await import("./rate-limit");
    const digest = digestSecurityIdentifier("login", "Pessoa@Exemplo.com");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain("pessoa");
    expect(digest).toBe(digestSecurityIdentifier("login", "pessoa@exemplo.com"));
    expect(digest).not.toBe(digestSecurityIdentifier("captura", "pessoa@exemplo.com"));
  });
});
