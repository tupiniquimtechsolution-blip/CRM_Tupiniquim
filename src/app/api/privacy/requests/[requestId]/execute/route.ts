import { resolveCurrentActor } from "@/lib/current-actor";
import { executePrivacyRequest } from "@/modules/privacy/execution";

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const actor = await resolveCurrentActor();
  if (!actor) return Response.json({ error: "Não autorizado." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const { requestId } = await context.params;
  const formData = await request.formData();
  const previewToken = String(formData.get("previewToken") ?? "").trim();
  if (!previewToken) return Response.json({ error: "Preview obrigatório." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  try {
    const result = await executePrivacyRequest(actor, requestId, previewToken);
    return new Response(JSON.stringify(result.packageData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Não foi possível executar a solicitação de privacidade." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
