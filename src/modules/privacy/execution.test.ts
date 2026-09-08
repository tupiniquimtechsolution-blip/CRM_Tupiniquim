import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPrivacyPreviewToken, verifyPrivacyPreviewToken } from "./execution";

describe("privacy preview token", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-only-auth-secret-32-characters");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const payload = {
    version: 1 as const,
    requestId: "request-1",
    organizationId: "org-1",
    actorId: "user-1",
    requestType: "PORTABILITY" as const,
    requestUpdatedAt: "2026-09-08T12:00:00.000Z",
    subjectDigest: "a".repeat(64),
    issuedAt: 1_000,
    expiresAt: 901_000,
  };

  it("assina e valida preview íntegro", () => {
    const token = createPrivacyPreviewToken(payload);
    expect(verifyPrivacyPreviewToken(token, 2_000)).toEqual(payload);
  });

  it("rejeita token adulterado", () => {
    const token = createPrivacyPreviewToken(payload);
    expect(() => verifyPrivacyPreviewToken(token.replace(/.$/, "x"), 2_000)).toThrow("Preview inválido ou expirado.");
  });

  it("rejeita preview expirado", () => {
    const token = createPrivacyPreviewToken(payload);
    expect(() => verifyPrivacyPreviewToken(token, 901_000)).toThrow("Preview inválido ou expirado.");
  });
});
