import Link from "next/link";
import { fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { getCurrentActor } from "@/lib/current-actor";
import { listCorrectionTargets } from "@/modules/privacy/correction";
import { createCorrectionPreviewAction } from "../../actions";

export const metadata = { title: "Correção LGPD" };

export default async function PrivacyCorrectionPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const workspace = await listCorrectionTargets(await getCurrentActor(), requestId);

  return <div className="mx-auto max-w-4xl space-y-6">
    <div>
      <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href="/configuracoes/privacidade">← Voltar para privacidade</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Q2.3B · correção controlada</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Correção do titular</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Protocolo {workspace.request.protocol}. Somente nome, e-mail e telefone podem ser alterados neste fluxo. Cada registro exige preview antes da aplicação.</p>
    </div>

    {workspace.targets.length ? <div className="grid gap-4 lg:grid-cols-2">{workspace.targets.map((target) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={`${target.entityType}:${target.id}`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{target.entityType}</p><h2 className="mt-1 font-bold text-slate-950">{target.name}</h2></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">registro elegível</span></div>
      <form action={createCorrectionPreviewAction} className="mt-5 grid gap-3">
        <input name="requestId" type="hidden" value={requestId} />
        <input name="entityType" type="hidden" value={target.entityType} />
        <input name="entityId" type="hidden" value={target.id} />
        <label className={labelClass}>Nome *<input className={fieldClass} defaultValue={target.name} maxLength={160} minLength={2} name="name" required /></label>
        <label className={labelClass}>E-mail<input className={fieldClass} defaultValue={target.email ?? ""} maxLength={254} name="email" type="email" /></label>
        <label className={labelClass}>Telefone<input className={fieldClass} defaultValue={target.phone ?? ""} maxLength={40} name="phone" /></label>
        <button className={submitClass} type="submit">Pré-visualizar correção</button>
      </form>
    </article>)}</div> : <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-950">Nenhum registro elegível encontrado</h2><p className="mt-2 text-sm text-amber-900">O e-mail do pedido não corresponde a Contact ou Company desta organização. Revise o escopo manualmente sem ampliar a busca textual.</p></section>}
  </div>;
}
