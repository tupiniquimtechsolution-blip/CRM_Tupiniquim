import { CalendarCheck, CheckCircle2, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuickCreate, fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentActor } from "@/lib/current-actor";
import { activitiesView } from "@/lib/view-data";
import { createActivityAction } from "../actions";

export const metadata = { title: "Atividades" };

export default async function ActivitiesPage() {
  const activities = await activitiesView(await getCurrentActor());
  return <div className="space-y-6"><PageHeader eyebrow="Funil e produtividade" title="Atividades e follow-ups" description="Priorize tarefas por SLA, prazo e responsabilidade sem deixar leads esquecidos." action={<QuickCreate label="Nova atividade"><form action={createActivityAction} className="grid gap-3"><label className={labelClass}>Título *<input className={fieldClass} name="title" required /></label><label className={labelClass}>Tipo *<select className={fieldClass} name="type"><option value="FOLLOW_UP">Follow-up</option><option value="CALL">Ligação</option><option value="MEETING">Reunião</option><option value="TASK">Tarefa</option></select></label><label className={labelClass}>Prazo *<input className={fieldClass} name="dueAt" type="datetime-local" required /></label><label className={labelClass}>Descrição<textarea className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm" name="description" /></label><button className={submitClass}>Agendar atividade</button></form></QuickCreate>} />
    <section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl bg-slate-950 p-5 text-white"><Clock3 className="text-amber-400" /><p className="mt-5 text-2xl font-bold">3</p><p className="text-sm text-slate-400">Vencem hoje</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><CalendarCheck className="text-blue-500" /><p className="mt-5 text-2xl font-bold">12</p><p className="text-sm text-slate-500">Próximos 7 dias</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="text-emerald-500" /><p className="mt-5 text-2xl font-bold">84%</p><p className="text-sm text-slate-500">Concluídas no SLA</p></article></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{activities.map((activity) => <article key={activity.id} className="grid gap-3 p-5 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"><button aria-label={`Concluir ${activity.title}`} className="grid size-9 place-items-center rounded-full border-2 border-slate-200 text-transparent hover:border-emerald-500 hover:text-emerald-500"><CheckCircle2 size={20} /></button><div><h2 className="text-sm font-bold text-slate-900">{activity.title}</h2><p className="mt-1 text-xs text-slate-500">{activity.company} · {activity.type} · {activity.owner}</p></div><span className="text-xs font-semibold text-slate-500">{activity.due}</span><StatusBadge>{activity.status}</StatusBadge></article>)}</div></section>
  </div>;
}
