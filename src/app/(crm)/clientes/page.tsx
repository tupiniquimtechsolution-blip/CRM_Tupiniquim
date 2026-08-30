import { AlertTriangle, CheckCircle2, CircleDollarSign, ClipboardCheck, Clock3, Headphones, HeartPulse, RefreshCw, Rocket, TicketCheck, TrendingUp, UsersRound } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { QuickCreate, fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentActor } from "@/lib/current-actor";
import { formatCurrency } from "@/lib/utils";
import { customersView } from "@/lib/view-data";
import {
  createOnboardingAction,
  createRenewalAction,
  createTicketAction,
  createUpsellAction,
  refreshCustomerHealthAction,
  transitionRenewalAction,
  transitionTicketAction,
  transitionUpsellAction,
  updateOnboardingStepAction,
} from "../actions";

export const metadata = { title: "Clientes e retenção" };

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const sectionTitle = "flex items-center gap-2 text-sm font-bold text-slate-950";
const smallButton = "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50";

function CustomerSelect({ customers }: { customers: Awaited<ReturnType<typeof customersView>> }) {
  return <select className={fieldClass} name="companyId" required><option value="">Selecione</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>;
}

export default async function CustomersPage() {
  const customers = await customersView(await getCurrentActor());
  const averageHealth = customers.length ? Math.round(customers.reduce((sum, customer) => sum + customer.health.score, 0) / customers.length) : 0;
  const openTickets = customers.reduce((sum, customer) => sum + customer.tickets.filter((ticket) => !["Resolvido", "Fechado"].includes(ticket.status)).length, 0);
  const renewalValue = customers.flatMap((customer) => customer.renewals).filter((renewal) => renewal.days <= 90 && renewal.status !== "Churn").reduce((sum, renewal) => sum + renewal.amount, 0);
  const upsellValue = customers.flatMap((customer) => customer.upsells).filter((upsell) => !["Ganho", "Perdido"].includes(upsell.status)).reduce((sum, upsell) => sum + upsell.value, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sucesso do cliente"
        title="Clientes e retenção"
        description="Uma visão 360º da jornada: aquisição, implantação, atendimento, receita, renovação e expansão da conta."
        action={
          <div className="flex flex-wrap gap-2">
            <QuickCreate label="Novo ticket">
              <form action={createTicketAction} className="grid gap-3">
                <label className={labelClass}>Cliente *<CustomerSelect customers={customers} /></label>
                <label className={labelClass}>Assunto *<input className={fieldClass} name="subject" required /></label>
                <label className={labelClass}>Descrição *<textarea className={`${fieldClass} h-24 py-3`} name="description" required /></label>
                <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Prioridade<select className={fieldClass} name="priority"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label><label className={labelClass}>SLA<input className={fieldClass} name="slaDueAt" type="datetime-local" /></label></div>
                <button className={submitClass}>Abrir ticket</button>
              </form>
            </QuickCreate>
            <QuickCreate label="Novo onboarding">
              <form action={createOnboardingAction} className="grid gap-3">
                <label className={labelClass}>Cliente *<CustomerSelect customers={customers} /></label>
                <label className={labelClass}>Plano *<input className={fieldClass} name="name" placeholder="Ex.: Implantação do CRM" required /></label>
                <label className={labelClass}>Conclusão prevista<input className={fieldClass} name="targetCompletionAt" type="date" /></label>
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">O plano inicia com cinco etapas padrão: kick-off, acessos, implantação, treinamento e go-live.</p>
                <button className={submitClass}>Iniciar onboarding</button>
              </form>
            </QuickCreate>
          </div>
        }
      />

      <section aria-label="Indicadores de retenção" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Clientes ativos" value={String(customers.length)} detail="Contas com jornada pós-venda" icon={UsersRound} accent />
        <MetricCard label="Saúde média" value={`${averageHealth}/100`} detail="Fórmula determinística v1" icon={HeartPulse} />
        <MetricCard label="Tickets abertos" value={String(openTickets)} detail="Atendimento que requer ação" icon={TicketCheck} />
        <MetricCard label="Renovação em 90 dias" value={formatCurrency(renewalValue)} detail={`${formatCurrency(upsellValue)} em upsells abertos`} icon={RefreshCw} />
      </section>

      <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <QuickCreate label="Registrar renovação">
          <form action={createRenewalAction} className="grid gap-3">
            <label className={labelClass}>Cliente *<CustomerSelect customers={customers} /></label>
            <label className={labelClass}>Título *<input className={fieldClass} name="title" required /></label>
            <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Valor *<input className={fieldClass} name="amount" type="number" min="0" step="0.01" required /></label><label className={labelClass}>Data *<input className={fieldClass} name="renewalAt" type="date" required /></label></div>
            <label className={labelClass}>Probabilidade<input className={fieldClass} defaultValue="50" max="100" min="0" name="probability" type="number" /></label>
            <button className={submitClass}>Registrar renovação</button>
          </form>
        </QuickCreate>
        <QuickCreate label="Identificar upsell">
          <form action={createUpsellAction} className="grid gap-3">
            <label className={labelClass}>Cliente *<CustomerSelect customers={customers} /></label>
            <label className={labelClass}>Oportunidade *<input className={fieldClass} name="title" required /></label>
            <div className="grid grid-cols-2 gap-3"><label className={labelClass}>Valor potencial *<input className={fieldClass} name="potentialValue" type="number" min="0.01" step="0.01" required /></label><label className={labelClass}>Previsão<input className={fieldClass} name="expectedCloseAt" type="date" /></label></div>
            <label className={labelClass}>Contexto<textarea className={`${fieldClass} h-24 py-3`} name="description" /></label>
            <button className={submitClass}>Criar oportunidade</button>
          </form>
        </QuickCreate>
        <p className="ml-auto self-center text-xs leading-5 text-slate-500">Mensagens externas e automações permanecem sujeitas à aprovação humana nas próximas fases.</p>
      </section>

      {customers.length === 0 ? (
        <section className={`${cardClass} py-12 text-center`}><UsersRound className="mx-auto text-slate-300" size={36} /><h2 className="mt-4 font-bold text-slate-900">Nenhum cliente ativo</h2><p className="mt-2 text-sm text-slate-500">Aceite uma proposta ou converta uma oportunidade para iniciar a jornada de retenção.</p></section>
      ) : customers.map((customer) => (
        <article key={customer.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="grid gap-5 border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-amber-400">{customer.name.charAt(0)}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-950">{customer.name}</h2><StatusBadge>{customer.health.band}</StatusBadge></div><p className="mt-1 text-xs text-slate-500">{customer.segment} · {customer.owner}</p><p className="mt-3 text-xs text-slate-500">Jornada: {customer.journey.leads} lead(s) · {customer.journey.opportunities} oportunidade(s) · {customer.journey.proposals} proposta(s) · {customer.journey.contracts} contrato(s) · {customer.journey.activities} interação(ões)</p></div></div>
            <div className="flex items-center gap-4"><div className="text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Health score</p><p className="mt-1 text-3xl font-black text-slate-950">{customer.health.score}<span className="text-sm font-medium text-slate-400">/100</span></p></div><form action={refreshCustomerHealthAction}><input name="companyId" type="hidden" value={customer.id} /><button aria-label={`Recalcular saúde de ${customer.name}`} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-amber-50"><RefreshCw size={17} /></button></form></div>
          </header>

          {customer.health.risks.length > 0 && <div className="flex flex-wrap gap-2 border-b border-orange-100 bg-orange-50/70 px-5 py-3 sm:px-6"><AlertTriangle className="text-orange-600" size={16} />{customer.health.risks.map((risk) => <span key={risk} className="text-xs font-semibold text-orange-800">{risk}</span>)}</div>}

          <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-2">
            <section className={cardClass}>
              <h3 className={sectionTitle}><ClipboardCheck className="text-amber-600" size={17} />Onboarding</h3>
              {customer.onboarding ? <><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">{customer.onboarding.name}</p><p className="mt-1 text-xs text-slate-500">{customer.onboarding.progress}% concluído</p></div><StatusBadge>{customer.onboarding.status}</StatusBadge></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${customer.onboarding.progress}%` }} /></div><div className="mt-4 space-y-2">{customer.onboarding.steps.map((step) => <div key={step.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><CheckCircle2 className={step.status === "Concluída" ? "text-emerald-500" : "text-slate-300"} size={16} /><span className="min-w-0 flex-1 text-xs font-medium text-slate-700">{step.title}</span><span className="text-[11px] text-slate-500">{step.status}</span>{step.status !== "Concluída" && <form action={updateOnboardingStepAction}><input name="stepId" type="hidden" value={step.id} /><input name="status" type="hidden" value="COMPLETED" /><button className={smallButton}>Concluir</button></form>}</div>)}</div></> : <p className="mt-4 text-sm text-slate-500">Nenhum plano de onboarding iniciado.</p>}
            </section>

            <section className={cardClass}>
              <h3 className={sectionTitle}><Headphones className="text-amber-600" size={17} />Tickets e atendimento</h3>
              <div className="mt-4 space-y-3">{customer.tickets.length ? customer.tickets.map((ticket) => <div key={ticket.id} className={`rounded-xl border p-3 ${ticket.overdue ? "border-red-200 bg-red-50/60" : "border-slate-100 bg-slate-50"}`}><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold text-slate-400">{ticket.number}</span><p className="min-w-0 flex-1 text-xs font-bold text-slate-800">{ticket.subject}</p><StatusBadge>{ticket.priority}</StatusBadge></div><div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><StatusBadge>{ticket.status}</StatusBadge><Clock3 size={13} /><span className={ticket.overdue ? "font-bold text-red-700" : ""}>{ticket.sla}</span>{!["Resolvido", "Fechado"].includes(ticket.status) && <form action={transitionTicketAction} className="ml-auto"><input name="ticketId" type="hidden" value={ticket.id} /><input name="status" type="hidden" value={ticket.status === "Aberto" ? "IN_PROGRESS" : "RESOLVED"} /><button className={smallButton}>{ticket.status === "Aberto" ? "Iniciar" : "Resolver"}</button></form>}</div></div>) : <p className="text-sm text-slate-500">Nenhum ticket registrado.</p>}</div>
            </section>

            <section className={cardClass}>
              <h3 className={sectionTitle}><RefreshCw className="text-amber-600" size={17} />Renovações e churn</h3>
              <div className="mt-4 space-y-3">{customer.renewals.length ? customer.renewals.map((renewal) => <div key={renewal.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-800">{renewal.title}</p><p className="mt-1 text-[11px] text-slate-500">{renewal.date} · {renewal.days} dia(s)</p></div><strong className="text-xs text-slate-900">{formatCurrency(renewal.amount)}</strong></div><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge>{renewal.status}</StatusBadge>{!["Renovada", "Churn", "Cancelada"].includes(renewal.status) && <><form action={transitionRenewalAction}><input name="renewalId" type="hidden" value={renewal.id} /><input name="status" type="hidden" value={renewal.status === "Próxima" ? "IN_NEGOTIATION" : "RENEWED"} /><button className={smallButton}>{renewal.status === "Próxima" ? "Negociar" : "Renovar"}</button></form><details><summary className={`${smallButton} cursor-pointer list-none text-red-700`}>Registrar churn</summary><form action={transitionRenewalAction} className="mt-2 flex gap-2"><input name="renewalId" type="hidden" value={renewal.id} /><input name="status" type="hidden" value="CHURNED" /><input aria-label="Motivo do churn" className="h-8 min-w-0 rounded-lg border border-red-200 px-2 text-xs" name="churnReason" placeholder="Motivo obrigatório" required /><button className={smallButton}>Confirmar</button></form></details></>}</div></div>) : <p className="text-sm text-slate-500">Nenhuma renovação registrada.</p>}</div>
            </section>

            <section className={cardClass}>
              <h3 className={sectionTitle}><Rocket className="text-amber-600" size={17} />Expansão e upsell</h3>
              <div className="mt-4 space-y-3">{customer.upsells.length ? customer.upsells.map((upsell) => <div key={upsell.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-800">{upsell.title}</p><p className="mt-1 text-[11px] text-slate-500">Previsão: {upsell.date}</p></div><strong className="text-xs text-slate-900">{formatCurrency(upsell.value)}</strong></div><div className="mt-3 flex items-center gap-2"><StatusBadge>{upsell.status}</StatusBadge>{!["Ganho", "Perdido"].includes(upsell.status) && <form action={transitionUpsellAction} className="ml-auto"><input name="upsellId" type="hidden" value={upsell.id} /><input name="status" type="hidden" value={upsell.status === "Identificado" ? "QUALIFIED" : upsell.status === "Qualificado" ? "PROPOSED" : "WON"} /><button className={smallButton}>{upsell.status === "Proposto" ? "Marcar ganho" : "Avançar"}</button></form>}</div></div>) : <p className="text-sm text-slate-500">Nenhuma oportunidade de expansão.</p>}</div>
            </section>
          </div>

          <footer className="grid gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:grid-cols-3 sm:px-6"><div className="flex items-center gap-3"><CircleDollarSign className="text-emerald-600" size={18} /><div><p className="text-[11px] text-slate-500">MRR ativo</p><strong className="text-sm text-slate-900">{formatCurrency(customer.mrr)}</strong></div></div><div className="flex items-center gap-3"><TrendingUp className="text-blue-600" size={18} /><div><p className="text-[11px] text-slate-500">Receita de projetos</p><strong className="text-sm text-slate-900">{formatCurrency(customer.projectRevenue)}</strong></div></div><div className="flex items-center gap-3"><HeartPulse className="text-rose-600" size={18} /><div><p className="text-[11px] text-slate-500">Risco acompanhado</p><strong className="text-sm text-slate-900">{customer.health.risks.length ? `${customer.health.risks.length} sinal(is)` : "Nenhum sinal"}</strong></div></div></footer>
        </article>
      ))}
    </div>
  );
}
