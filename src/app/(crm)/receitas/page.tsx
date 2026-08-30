import { CircleDollarSign, RefreshCw, Rocket, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { QuickCreate, fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentActor } from "@/lib/current-actor";
import { companiesView, revenuesView } from "@/lib/view-data";
import { formatCurrency } from "@/lib/utils";
import { createRevenueAction } from "../actions";

export const metadata = { title: "Receitas" };

export default async function RevenuesPage() {
  const actor = await getCurrentActor(); const [revenues, companies] = await Promise.all([revenuesView(actor), companiesView(actor)]); const mrr = revenues.filter((row) => row.type === "MRR").reduce((sum, row) => sum + row.amount, 0); const projects = revenues.filter((row) => row.type === "Projeto" || row.type === "PROJECT").reduce((sum, row) => sum + row.amount, 0); const upsells = revenues.filter((row) => row.type === "Upsell" || row.type === "UPSELL").reduce((sum, row) => sum + row.amount, 0);
  return <div className="space-y-6"><PageHeader eyebrow="Comercial e receita" title="Receitas e contratos" description="Acompanhe recorrência, projetos pontuais e oportunidades de expansão sem duplicar registros." action={<QuickCreate label="Registrar receita"><form action={createRevenueAction} className="grid gap-3"><label className={labelClass}>Empresa *<select className={fieldClass} name="companyId" required><option value="">Selecione</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className={labelClass}>Tipo *<select className={fieldClass} name="type"><option value="MRR">MRR</option><option value="PROJECT">Projeto</option><option value="UPSELL">Upsell</option></select></label><label className={labelClass}>Descrição *<input className={fieldClass} name="description" required /></label><div className="grid grid-cols-2 gap-3"><label className={labelClass}>Valor *<input className={fieldClass} name="amount" type="number" step="0.01" min="0" required /></label><label className={labelClass}>Início *<input className={fieldClass} name="startsAt" type="date" required /></label></div><button className={submitClass}>Registrar receita</button></form></QuickCreate>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="MRR registrado" value={formatCurrency(mrr)} detail="Receitas recorrentes ativas e previstas" icon={RefreshCw} accent /><MetricCard label="Projetos" value={formatCurrency(projects)} detail="Receita pontual registrada" icon={Rocket} /><MetricCard label="Upsells" value={formatCurrency(upsells)} detail="Expansão na base de clientes" icon={TrendingUp} /><MetricCard label="Total gerencial" value={formatCurrency(revenues.reduce((sum, row) => sum + row.amount, 0))} detail="Sem projeção fiscal ou contábil" icon={CircleDollarSign} /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{revenues.map((revenue) => <article key={revenue.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><h2 className="text-sm font-bold text-slate-900">{revenue.description}</h2><p className="mt-1 text-xs text-slate-500">{revenue.company}</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{revenue.type}</span><StatusBadge>{revenue.status}</StatusBadge><strong className="text-sm text-slate-950">{formatCurrency(revenue.amount)}</strong></article>)}</div></section>
  </div>;
}
