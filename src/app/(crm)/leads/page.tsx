import { Filter, Search, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuickCreate, fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentActor } from "@/lib/current-actor";
import { companiesView, leadsView } from "@/lib/view-data";
import { createLeadAction } from "../actions";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const actor = await getCurrentActor(); const [leads, companies] = await Promise.all([leadsView(actor), companiesView(actor)]);
  return <div className="space-y-6"><PageHeader eyebrow="CRM essencial" title="Leads" description="Qualifique origens, valide empresas e mantenha cada oportunidade sob responsabilidade clara." action={<QuickCreate label="Novo lead"><form action={createLeadAction} className="grid gap-3"><label className={labelClass}>Empresa *<select className={fieldClass} name="companyId" required><option value="">Selecione</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label><label className={labelClass}>Oportunidade identificada *<input className={fieldClass} name="title" required /></label><div className="grid grid-cols-2 gap-3"><label className={labelClass}>Origem *<input className={fieldClass} name="source" required /></label><label className={labelClass}>Fonte de validação *<input className={fieldClass} name="validationSource" required /></label></div><label className={labelClass}>Score<input className={fieldClass} name="score" type="number" min="0" max="100" defaultValue="50" /></label><button className={submitClass}>Salvar lead validado</button></form></QuickCreate>} />
    <div className="flex gap-3"><label className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-amber-500" placeholder="Buscar leads" /></label><button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"><Filter size={16} /> <span className="hidden sm:inline">Filtros</span></button></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{leads.map((lead) => <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><StatusBadge>{lead.status}</StatusBadge><span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star size={14} fill="currentColor" />{lead.score}</span></div><h2 className="mt-5 text-base font-bold text-slate-950">{lead.company}</h2><p className="mt-1 text-sm text-slate-600">{lead.title}</p><div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500"><div className="flex justify-between"><span>Origem</span><strong className="text-slate-700">{lead.source}</strong></div><div className="mt-2 flex justify-between"><span>Responsável</span><strong className="text-slate-700">{lead.owner}</strong></div></div></article>)}</section>
  </div>;
}
