import { afterEach, describe, expect, it } from "vitest";
import { validateRuntimeConfiguration } from "./runtime";

const snapshot = { ...process.env };
afterEach(() => {
  process.env = { ...snapshot };
});

describe("configuração de produção", () => {
  it("rejeita demo, URL sem HTTPS e segredo curto", () => {
    process.env.DATABASE_URL = "postgresql://local/test";
    process.env.AUTH_SECRET = "curto";
    process.env.DEMO_MODE = "true";
    process.env.APP_URL = "http://localhost:3000";
    process.env.AI_PROVIDER = "simulated";
    delete process.env.PRIVACY_CONTACT_EMAIL;
    expect(validateRuntimeConfiguration("production").ok).toBe(false);
  });

  it("aprova os requisitos mínimos sem revelar valores", () => {
    process.env.DATABASE_URL = "postgresql://local/test";
    process.env.AUTH_SECRET = "x".repeat(32);
    process.env.DEMO_MODE = "false";
    process.env.APP_URL = "https://crm.example.test";
    process.env.PRIVACY_CONTACT_EMAIL = "privacidade@example.test";
    process.env.AI_PROVIDER = "simulated";
    const result = validateRuntimeConfiguration("production");
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toContain("postgresql://");
  });
});
