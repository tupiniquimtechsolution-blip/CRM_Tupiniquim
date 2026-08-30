import { processCaptureSubmission } from "@/modules/integrations/capture";
import { consumeRateLimit, requestFingerprint } from "@/modules/security/rate-limit";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const fingerprint = requestFingerprint(request);
  const rateLimit = await consumeRateLimit({ scope: `capture:${publicId}`, identifier: fingerprint, limit: 20, windowMs: 10 * 60_000 });
  if (!rateLimit.allowed) return Response.json({ error: "Muitas solicitações. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  const contentType = request.headers.get("content-type") ?? "";
  const raw: Record<string, unknown> = {};
  let eventKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json() as Record<string, unknown>;
    Object.assign(raw, body);
    eventKey ||= String(body.submissionId ?? "").trim();
  } else {
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) raw[key] = typeof value === "string" ? value : value.name;
    eventKey ||= String(formData.get("submissionId") ?? "").trim();
  }
  if (!eventKey || eventKey.length > 200) return Response.json({ error: "Identificador da submissão obrigatório." }, { status: 400 });
  try {
    const result = await processCaptureSubmission(publicId, eventKey, raw, fingerprint);
    if (contentType.includes("application/json")) return Response.json({ accepted: true, duplicate: result.duplicate, submissionId: result.submission.id }, { status: result.duplicate ? 200 : 201 });
    return Response.redirect(new URL(`/captura/${publicId}?enviado=1`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no formulário.";
    return Response.json({ error: message }, { status: 400 });
  }
}
