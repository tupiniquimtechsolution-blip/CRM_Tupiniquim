import { Buffer } from "node:buffer";
import { CaptureInputError, processCaptureSubmission } from "@/modules/integrations/capture";
import { consumeRateLimit, requestFingerprint } from "@/modules/security/rate-limit";

const maxPayloadBytes = 64 * 1024;

function payloadTooLarge(body: string) {
  return Buffer.byteLength(body, "utf8") > maxPayloadBytes;
}

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await context.params;
  const fingerprint = requestFingerprint(request);
  const rateLimit = await consumeRateLimit({
    scope: `capture:${publicId}`,
    identifier: fingerprint,
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Muitas solicitações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxPayloadBytes) {
    return Response.json({ error: "Payload excede 64 KB." }, { status: 413 });
  }

  const raw: Record<string, unknown> = {};
  let eventKey = request.headers.get("idempotency-key")?.trim() ?? "";

  if (contentType.includes("application/json")) {
    const text = await request.text();
    if (payloadTooLarge(text)) return Response.json({ error: "Payload excede 64 KB." }, { status: 413 });

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "JSON inválido." }, { status: 400 });
    }
    Object.assign(raw, body as Record<string, unknown>);
    eventKey ||= String((body as Record<string, unknown>).submissionId ?? "").trim();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    if (payloadTooLarge(text)) return Response.json({ error: "Payload excede 64 KB." }, { status: 413 });

    const formData = new URLSearchParams(text);
    for (const [key, value] of formData.entries()) raw[key] = value;
    eventKey ||= String(formData.get("submissionId") ?? "").trim();
  } else {
    return Response.json({ error: "Tipo de conteúdo não suportado." }, { status: 415 });
  }

  if (!eventKey || eventKey.length > 200) {
    return Response.json({ error: "Identificador da submissão obrigatório." }, { status: 400 });
  }

  try {
    const result = await processCaptureSubmission(publicId, eventKey, raw, fingerprint);
    if (contentType.includes("application/json")) {
      return Response.json(
        { accepted: true, duplicate: result.duplicate, submissionId: result.submission.id },
        { status: result.duplicate ? 200 : 201 },
      );
    }
    return Response.redirect(new URL(`/captura/${publicId}?enviado=1`, request.url), 303);
  } catch (error) {
    if (error instanceof CaptureInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Não foi possível processar a submissão." }, { status: 500 });
  }
}
