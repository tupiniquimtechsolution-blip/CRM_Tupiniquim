import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/current-actor";
import { CORRECTION_PREVIEW_COOKIE, readCorrectionPreview } from "@/modules/privacy/correction";
import { executeCorrectionAction } from "../../../actions";

export const metadata = { title: "Preview da correção LGPD" };
const labels = { name: "Nome", email: "E-mail", phone: "Telefone" } as const;

export default async function PrivacyCorrectionPreviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(CORRECTION_PREVIEW_COOKIE)?.value;
  if (!token) redirect(`/configuracoes/privacidade/${encodeURIComponent(requestId)}/correction`);
  const result = await readCorrectionPreview(await getCurrentActor(), requestId, token);

  return <div className="mx-auto max-w-3xl space-y-6">
    <div>
      <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href={`/configuracoes/privacidade/${encodeURIComponent(requestId)}/correction`}>← Alterar proposta</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Q2.3B · preview obrigatório</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Prévia da correção</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Confira exatamente os campos que serão alterados. Se o registro ou o pedido mudar antes da confirmação, este preview será rejeitado.</p>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{result.preview.entityType}</p>
      <div className="mt-4 space-y-3">{result.fields.map((field) => {
        const key = field as keyof typeof labels;
        return <div className="grid gap-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-[120px_1fr_1fr]" key={field}>
          <strong className="text-xs text-slate-700">{labels[key]}</strong>
          <div><span className="text-[11px] font-semibold text-slate-400">Antes</span><p className="mt-1 break-words text-sm text-slate-700">{String(result.before[key] ?? "—")}</p></div>
          <div><span className="text-[11px] font-semibold text-slate-400">Depois</span><p className="mt-1 break-words text-sm font-semibold text-slate-950">{String(result.after[key] ?? "—")}</p></div>
        </div>;
      })}</div>
      <p className="mt-4 text-xs text-slate-500">Preview válido até {new Date(result.preview.expiresAt).toLocaleString("pt-BR")}.</p>
    </section>

    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-bold text-amber-950">Aplicar somente após revisar</h2>
      <p className="mt-2 text-xs leading-5 text-amber-900">A confirmação concluirá tecnicamente este pedido de correção. O log de auditoria guarda apenas campos afetados e digests, não os valores pessoais completos.</p>
      <form action={executeCorrectionAction} className="mt-4">
        <input name="requestId" type="hidden" value={requestId} />
        <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" type="submit">Aplicar correção</button>
      </form>
    </section>
  </div>;
}
