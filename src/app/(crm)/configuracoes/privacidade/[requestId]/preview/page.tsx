import Link from "next/link";
import { getCurrentActor } from "@/lib/current-actor";
import { previewPrivacyRequest } from "@/modules/privacy/execution";

export const metadata = { title: "Preview LGPD" };

export default async function PrivacyPreviewPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const actor = await getCurrentActor();
  const preview = await previewPrivacyRequest(actor, requestId);
  const total = Object.values(preview.counts).reduce((sum, value) => sum + value, 0);

  return <div className="mx-auto max-w-3xl space-y-6">
    <div>
      <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href="/configuracoes/privacidade">← Voltar para privacidade</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Q2.3A · revisão obrigatória</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Preview do pedido LGPD</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Revise a contagem antes de gerar o pacote. O preview expira em 15 minutos e fica vinculado ao pedido, organização e operador atuais.</p>
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-950">Escopo estruturado</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(preview.counts).map(([key, count]) => <div className="rounded-xl bg-slate-50 p-3" key={key}><dt className="text-xs font-semibold text-slate-500">{key}</dt><dd className="mt-1 text-xl font-black text-slate-950">{count}</dd></div>)}
      </dl>
      <p className="mt-4 text-xs text-slate-500">{total} registros estruturados · preview válido até {new Date(preview.expiresAt).toLocaleString("pt-BR")}.</p>
    </section>

    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="font-bold text-blue-950">Gerar pacote JSON</h2>
      <p className="mt-2 text-xs leading-5 text-blue-900">A geração conclui tecnicamente o pedido e baixa o arquivo JSON. A entrega ao titular continua sendo uma etapa operacional/manual.</p>
      <form action={`/api/privacy/requests/${encodeURIComponent(requestId)}/execute`} className="mt-4" method="post">
        <input name="previewToken" type="hidden" value={preview.token} />
        <button className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white" type="submit">Executar e baixar JSON</button>
      </form>
    </section>
  </div>;
}
