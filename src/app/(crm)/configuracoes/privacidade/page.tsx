import { AlertTriangle, CheckCircle2, Clock3, DatabaseZap, FileKey2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuickCreate, fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentActor } from "@/lib/current-actor";
import { listPrivacyWorkspace } from "@/modules/privacy/service";
import { can } from "@/modules/shared/tenant";
import { notFound } from "next/navigation";
import { createPrivacyRequestAction, createSecurityIncidentAction, saveRetentionPolicyAction, updatePrivacyRequestAction } from "./actions";
import { PrivacyExportControls } from "./export-controls";

export const metadata = { title: "Privacidade e LGPD" };
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const defaults = { commercialDataDays: 1825, captureSubmissionDays: 730, reportExportDays: 1, aiRequestDays: 365, auditLogDays: 1825, incidentLogDays: 1825 };

const requestLabels = {
  CONFIRMATION_ACCESS: "Confirmação e acesso",
  CORRECTION: "Correção",
  ANONYMIZATION_BLOCKING_DELETION: "Anonimização, bloqueio ou eliminação",
  PORTABILITY: "Portabilidade",
  CONSENT_REVOCATION: "Revogação do consentimento",
  OPPOSITION: "Oposição",
  AUTOMATED_DECISION_REVIEW: "Revisão de decisão automatizada",
};

function nextStatuses(status: string, type: keyof typeof requestLabels) {
  if (status === "RECEIVED") return [["IDENTITY_VERIFICATION", "Verificar identidade"], ["DENIED", "Negar com justificativa"]] as const;
  if (status === "IDENTITY_VERIFICATION") return [["IN_PROGRESS", "Confirmar identidade e iniciar atendimento"], ["DENIED", "Negar com justificativa"]] as const;
  if (status === "IN_PROGRESS") {
    const terminal = ["CONFIRMATION_ACCESS", "PORTABILITY"].includes(type) ? [] : [["COMPLETED", "Concluir"]] as const;
    return [...terminal, ["DENIED", "Negar com justificativa"]] as const;
  }
  return [];
}

export default async function PrivacyPage() {
  const actor = await getCurrentActor();
  if (!can(actor.role, "privacy:read")) notFound();
  const workspace = await listPrivacyWorkspace(actor);
  const policy = workspace.policy ?? defaults;
  const canWrite = can(actor.role, "privacy:write");
  const open = workspace.requests.filter((item) => !["COMPLETED", "DENIED"].includes(item.status));
  const overdue = open.filter((item) => item.dueAt < new Date());
  return <div className="space-y-7">
    <PageHeader eyebrow="Governança e proteção de dados" title="Privacidade e LGPD" description="Registro por organização de bases legais, solicitações de titulares, retenção e incidentes. A identidade do solicitante deve ser verificada antes de entregar, corrigir ou eliminar dados." action={canWrite ? <QuickCreate label="Registrar solicitação"><form action={createPrivacyRequestAction} className="grid gap-3"><label className={labelClass}>Direito exercido *<select className={fieldClass} name="type" required>{Object.entries(requestLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className={labelClass}>E-mail do titular *<input className={fieldClass} name="subjectEmail" required type="email" /></label><label className={labelClass}>Nome<input className={fieldClass} name="subjectName" /></label><label className={labelClass}>Detalhes<textarea className={`${fieldClass} min-h-24 py-3`} name="details" /></label><button className={submitClass}>Gerar protocolo</button></form></QuickCreate> : null} />

    <section aria-label="Indicadores de privacidade" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className={card}><ShieldCheck className="text-emerald-600" size={21} /><p className="mt-3 text-xs text-slate-500">Consentimentos ativos</p><strong className="mt-1 block text-2xl">{workspace.consents.filter((item) => item.status === "GRANTED").length}</strong></article>
      <article className={card}><Clock3 className="text-amber-600" size={21} /><p className="mt-3 text-xs text-slate-500">Solicitações em aberto</p><strong className="mt-1 block text-2xl">{open.length}</strong></article>
      <article className={card}><AlertTriangle className="text-red-600" size={21} /><p className="mt-3 text-xs text-slate-500">SLA interno vencido</p><strong className="mt-1 block text-2xl">{overdue.length}</strong></article>
      <article className={card}><FileKey2 className="text-blue-600" size={21} /><p className="mt-3 text-xs text-slate-500">Incidentes abertos</p><strong className="mt-1 block text-2xl">{workspace.incidents.filter((item) => item.status !== "CLOSED").length}</strong></article>
    </section>

    <section className={card}><div className="flex items-center gap-2"><FileKey2 className="text-blue-600" size={18} /><h2 className="font-bold">Solicitações de titulares</h2></div><div className="mt-4 space-y-3">{workspace.requests.length ? workspace.requests.map((request) => {
      const options = nextStatuses(request.status, request.type);
      const exportable = request.status === "IN_PROGRESS" && (request.type === "CONFIRMATION_ACCESS" || request.type === "PORTABILITY");
      return <article className="rounded-xl border border-slate-200 p-4" key={request.id}><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{request.protocol} · {requestLabels[request.type]}</p><p className="mt-1 text-xs text-slate-500">{request.subjectEmail} · prazo interno {request.dueAt.toLocaleDateString("pt-BR")}</p></div><StatusBadge>{request.status}</StatusBadge></div>{canWrite && options.length ? <form action={updatePrivacyRequestAction} className="mt-4 grid gap-2 sm:grid-cols-[240px_1fr_auto]"><input name="requestId" type="hidden" value={request.id} /><label className="sr-only" htmlFor={`status-${request.id}`}>Novo status</label><select className={fieldClass} id={`status-${request.id}`} name="status">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="sr-only" htmlFor={`resolution-${request.id}`}>Resolução</label><input className={fieldClass} id={`resolution-${request.id}`} name="resolution" placeholder="Resolução ou justificativa" /><button className="rounded-xl bg-slate-950 px-4 text-xs font-bold text-white">Atualizar</button></form> : null}{canWrite && exportable ? <PrivacyExportControls requestId={request.id} requestType={request.type} /> : null}</article>;
    }) : <p className="py-8 text-center text-sm text-slate-500">Nenhuma solicitação registrada.</p>}</div></section>

    <section className={card}><div className="flex items-center gap-2"><DatabaseZap className="text-violet-600" size={18} /><h2 className="font-bold">Política de retenção</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Os prazos são limites operacionais e devem ser aprovados pelo responsável jurídico/encarregado. Incidentes têm mínimo técnico de cinco anos. Dados comerciais não são eliminados em lote sem análise individual.</p><form action={saveRetentionPolicyAction} className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
      ["commercialDataDays", "Dados comerciais"], ["captureSubmissionDays", "Submissões de captura"], ["reportExportDays", "Arquivos exportados"], ["aiRequestDays", "Solicitações de IA"], ["auditLogDays", "Logs de auditoria"], ["incidentLogDays", "Registros de incidentes"],
    ].map(([name, label]) => <label className={labelClass} key={name}>{label} (dias)<input className={fieldClass} defaultValue={policy[name as keyof typeof defaults] as number} min={name === "incidentLogDays" ? 1825 : 1} name={name} required type="number" /></label>)}{canWrite ? <button className={`${submitClass} sm:col-span-2 xl:col-span-3`}><CheckCircle2 size={16} />Salvar política</button> : null}</form></section>
    <section className={card}><div className="flex items-center gap-2"><AlertTriangle className="text-red-600" size={18} /><h2 className="font-bold">Registro de incidentes</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">Todo incidente com dados pessoais deve permanecer registrado por ao menos cinco anos. Havendo risco ou dano relevante, o sistema sinaliza o prazo operacional de três dias úteis para avaliação e comunicação pelo controlador.</p>{canWrite && <form action={createSecurityIncidentAction} className="mt-5 grid gap-3 sm:grid-cols-2"><label className={labelClass}>Título *<input className={fieldClass} name="title" required /></label><label className={labelClass}>Severidade *<select className={fieldClass} name="severity"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label><label className={`${labelClass} sm:col-span-2`}>Resumo e medidas iniciais *<textarea className={`${fieldClass} min-h-24 py-3`} name="summary" required /></label><label className="flex items-center gap-2 text-xs font-semibold"><input name="personalDataInvolved" type="checkbox" />Envolve dados pessoais</label><label className="flex items-center gap-2 text-xs font-semibold"><input name="relevantRisk" type="checkbox" />Pode causar risco ou dano relevante</label><button className={`${submitClass} sm:col-span-2`}>Registrar incidente</button></form>}<div className="mt-5 space-y-2">{workspace.incidents.map((incident) => <article className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 p-3" key={incident.id}><div className="min-w-0 flex-1"><p className="text-xs font-bold">{incident.protocol} · {incident.title}</p><p className="mt-1 text-[11px] text-slate-500">Detectado em {incident.detectedAt.toLocaleString("pt-BR")}{incident.notificationDueAt ? ` · avaliar comunicação até ${incident.notificationDueAt.toLocaleDateString("pt-BR")}` : ""}</p></div><StatusBadge>{incident.severity}</StatusBadge></article>)}</div></section>
  </div>;
}
