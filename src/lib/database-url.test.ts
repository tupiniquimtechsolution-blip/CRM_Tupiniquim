import { describe, expect, it } from "vitest";
import { resolveDatabaseUrl } from "./database-url";

describe("resolveDatabaseUrl", () => {
  it("falha fechado quando DATABASE_URL não está configurada", () => {
    expect(() => resolveDatabaseUrl({ NODE_ENV: "production" })).toThrow(
      "DATABASE_URL é obrigatória.",
    );
  });

  it("preserva DATABASE_URL explicitamente configurada", () => {
    expect(resolveDatabaseUrl({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://configured",
    })).toBe("postgresql://configured");
  });
});
