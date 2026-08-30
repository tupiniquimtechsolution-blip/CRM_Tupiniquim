import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  Cliente: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Aceita: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Ativa: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Qualificado: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Validado: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  Enviada: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Oportunidade: "bg-violet-50 text-violet-700 ring-violet-600/20",
  "Em aprovação": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Vencendo: "bg-red-50 text-red-700 ring-red-600/20",
  Forecast: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Saudável: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Atenção: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Em risco": "bg-orange-50 text-orange-700 ring-orange-600/20",
  Crítica: "bg-red-50 text-red-700 ring-red-600/20",
  Urgente: "bg-red-50 text-red-700 ring-red-600/20",
  Bloqueado: "bg-red-50 text-red-700 ring-red-600/20",
  Concluído: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Resolvido: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Renovada: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Churn: "bg-red-50 text-red-700 ring-red-600/20",
  Ganho: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({ children }: { children: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tone[children] ?? "bg-slate-100 text-slate-600 ring-slate-500/20")}>
      {children}
    </span>
  );
}
