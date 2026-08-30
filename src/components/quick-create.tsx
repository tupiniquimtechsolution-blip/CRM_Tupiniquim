export function QuickCreate({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none rounded-xl bg-amber-500 px-4 py-2.5 text-center text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400">{label}</summary>
      <div className="absolute right-0 top-12 z-40 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><strong className="text-base text-slate-950">{label}</strong><span className="text-xs text-slate-400">Campos obrigatórios *</span></div>
        {children}
      </div>
    </details>
  );
}

export const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
export const labelClass = "grid gap-1.5 text-xs font-semibold text-slate-600";
export const submitClass = "mt-2 h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-slate-950";
