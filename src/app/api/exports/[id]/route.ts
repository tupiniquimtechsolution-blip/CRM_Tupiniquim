import { getCurrentActor } from "@/lib/current-actor";
import { getAuthorizedExport } from "@/modules/reports/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const row = await getAuthorizedExport(await getCurrentActor(), id);
  if (!row) return Response.json({ error: "Exportação indisponível ou expirada." }, { status: 404 });
  return new Response(row.content, { headers: { "Content-Type": row.mimeType, "Content-Disposition": `attachment; filename="${row.fileName}"`, "Cache-Control": "private, no-store" } });
}
