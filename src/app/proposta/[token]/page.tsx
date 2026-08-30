import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getProposalByAccessToken } from "@/modules/proposals/service";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getProposalByAccessToken(token);
  if (!access) notFound();
  const proposal = access.proposal;
  return <main className="min-h-screen bg-[#f5f5f2] px-4 py-10 sm:px-6"><article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"><header className="bg-slate-950 p-7 text-white sm:p-10"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-amber-500 text-xl font-black text-slate-950">T</span><span className="flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck size={16} /> Link seguro e temporário</span></div><p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-amber-400">Proposta #{String(proposal.number).padStart(4, "0")} · versão {proposal.version}</p><h1 className="mt-3 text-3xl font-bold tracking-tight">{proposal.title}</h1><p className="mt-2 text-slate-400">Preparada para {proposal.company.name}</p></header><section className="p-7 sm:p-10"><div className="divide-y divide-slate-100">{proposal.items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-4"><div><strong className="text-sm text-slate-900">{item.description}</strong><p className="mt-1 text-xs text-slate-500">{Number(item.quantity)} × {formatCurrency(Number(item.unitPrice))}</p></div><strong className="text-sm text-slate-950">{formatCurrency(Number(item.total))}</strong></div>)}</div><div className="mt-6 rounded-2xl bg-slate-50 p-5"><div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{formatCurrency(Number(proposal.subtotal))}</span></div><div className="mt-2 flex justify-between text-sm text-slate-500"><span>Desconto</span><span>{formatCurrency(Number(proposal.discount))}</span></div><div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-xl font-bold text-slate-950"><span>Total</span><span>{formatCurrency(Number(proposal.total))}</span></div></div><p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={15} /> Esta visualização é auditável. O aceite definitivo permanece sujeito ao fluxo humano de aprovação e contrato.</p></section></article></main>;
}
