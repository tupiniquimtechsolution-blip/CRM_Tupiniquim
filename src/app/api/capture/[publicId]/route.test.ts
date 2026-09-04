import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  processCaptureSubmission: vi.fn(),
  consumeRateLimit: vi.fn(),
  requestFingerprint: vi.fn(),
}));

vi.mock("@/modules/integrations/capture", async () => {
  class CaptureInputError extends Error {}
  return {
    CaptureInputError,
    processCaptureSubmission: mocks.processCaptureSubmission,
  };
});
vi.mock("@/modules/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  requestFingerprint: mocks.requestFingerprint,
}));

describe("POST /api/capture/[publicId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestFingerprint.mockReturnValue("fingerprint");
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, remaining: 19, retryAfterSeconds: 60 });
  });

  it("rejeita payload JSON acima de 64 KB", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/capture/form-1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submissionId: "evt-1", interest: "x".repeat(70 * 1024) }),
    });

    const response = await POST(request, { params: Promise.resolve({ publicId: "form-1" }) });
    expect(response.status).toBe(413);
    expect(mocks.processCaptureSubmission).not.toHaveBeenCalled();
  });

  it("não expõe mensagem de exceção interna", async () => {
    mocks.processCaptureSubmission.mockRejectedValue(new Error("relation CaptureSubmission does not exist"));
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/capture/form-1", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        submissionId: "evt-1",
        contactName: "Pessoa",
        companyName: "Empresa",
        email: "pessoa@example.com",
        interest: "Contato",
        privacyConsent: "on",
        privacyNoticeVersion: "2026-08",
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ publicId: "form-1" }) });
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error).toBe("Não foi possível processar a submissão.");
    expect(JSON.stringify(body)).not.toContain("CaptureSubmission");
  });
});
