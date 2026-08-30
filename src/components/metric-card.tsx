import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, detail, icon: Icon, accent = false }: { label: string; value: string; detail: string; icon: LucideIcon; accent?: boolean }) {
  return (
    <article className={accent ? "rounded-2xl bg-slate-950 p-5 text-white shadow-sm" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <div className="flex items-center justify-between">
        <p className={accent ? "text-sm text-slate-300" : "text-sm text-slate-500"}>{label}</p>
        <span className={accent ? "rounded-xl bg-white/10 p-2 text-amber-400" : "rounded-xl bg-amber-50 p-2 text-amber-600"}><Icon size={18} /></span>
      </div>
      <p className="mt-5 text-2xl font-bold tracking-tight">{value}</p>
      <p className={accent ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>{detail}</p>
    </article>
  );
}
