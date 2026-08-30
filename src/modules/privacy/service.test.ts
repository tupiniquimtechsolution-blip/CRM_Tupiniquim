import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn() }));

describe("prazos de incidentes", () => {
  it("conta três dias úteis sem incluir o fim de semana", async () => {
    const { addBusinessDays } = await import("./service");
    expect(addBusinessDays(new Date("2026-08-13T12:00:00Z"), 3).toISOString()).toBe("2026-08-18T12:00:00.000Z");
  });
});
