import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDollarSign, Gauge, Target, TrendingUp, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { demoActivities, demoStages } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

const bars = [38, 52, 44, 68, 61, 82, 74, 93, 78, 88, 96, 91];

export const metadata = { title: "Visão geral" };

export default function DashboardPage() {
  const pipelineValue = demoStages.flatMap((stage) => stage.opportunities).reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Terça-feira, 11 de agosto" title="Bom dia, equipe Tupiniquim." description="O funil avançou 12% nesta semana. Há três follow-ups que precisam de atenção hoje." action={<Link href="/leads" className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">Cadastrar lead</Link>} />

      <section aria-label="Indicadores principais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pipeline aberto" value={formatCurrency(pipelineValue)} detail="+12% contra a semana anterior" icon={Target} accent />
        <MetricCard label="Receita recorrente" value="R$ 38,4 mil" detail="MRR ativo em 14 contratos" icon={CircleDollarSign} />
        <MetricCard label="Conversão do mês" value="24,8%" detail="6,2 pontos acima da meta" icon={Gauge} />
        <MetricCard label="Follow-ups hoje" value="8" detail="3 vencem nas próximas 2 horas" icon={CalendarClock} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-950">Receita conquistada</p><p className="mt-1 text-xs text-slate-500">Últimos 12 meses · valores conciliados</p></div><span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><TrendingUp size={14} />18,4%</span></div>
          <div className="mt-7 flex h-56 items-end gap-2 sm:gap-3" aria-label="Gráfico mensal de receita">
            {bars.map((height, index) => <div key={index} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-slate-200 transition group-hover:bg-amber-400" style={{ height: `${height}%` }} title={`${height} mil reais`} /></div>)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-medium uppercase tracking-wide text-slate-600"><span>Set</span><span>Dez</span><span>Mar</span><span>Jun</span><span>Ago</span></div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-950">Saúde do funil</p><p className="mt-1 text-xs text-slate-500">Distribuição por etapa</p></div><UsersRound className="text-slate-400" size={19} /></div>
          <div className="mt-6 space-y-5">{demoStages.map((stage) => { const value = stage.opportunities.reduce((sum, item) => sum + item.value, 0); const width = Math.max(18, Math.round((value / pipelineValue) * 100)); return <div key={stage.id}><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">{stage.name}</span><span className="text-slate-500">{stage.opportunities.length} · {formatCurrency(value)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: stage.color }} /></div></div>; })}</div>
          <Link href="/funil" className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Abrir funil completo <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="text-sm font-semibold text-slate-950">Próximas atividades</h2><p className="mt-1 text-xs text-slate-500">Prioridades da equipe para hoje</p></div><Link href="/atividades" className="text-xs font-bold text-amber-700 hover:text-amber-600">Ver agenda</Link></div>
        <div className="divide-y divide-slate-100">{demoActivities.slice(0, 3).map((activity) => <div key={activity.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"><div><p className="text-sm font-semibold text-slate-800">{activity.title}</p><p className="mt-1 text-xs text-slate-500">{activity.company} · {activity.owner}</p></div><span className="text-xs font-medium text-slate-500">{activity.due}</span><StatusBadge>{activity.status}</StatusBadge></div>)}</div>
      </section>
    </div>
  );
}
