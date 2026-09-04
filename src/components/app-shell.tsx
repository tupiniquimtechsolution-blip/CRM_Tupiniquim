import Link from "next/link";
import { Bell, Bot, Building2, CalendarCheck, ChartNoAxesCombined, ChevronDown, CircleDollarSign, FileText, HeartHandshake, LayoutDashboard, Menu, Search, Settings2, ShieldCheck, Target, UsersRound, Workflow } from "lucide-react";
import { initials } from "@/lib/utils";
import type { TenantActor } from "@/modules/shared/tenant";
import { can } from "@/modules/shared/tenant";

const navigation = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/leads", label: "Leads", icon: UsersRound },
  { href: "/funil", label: "Funil", icon: Target },
  { href: "/atividades", label: "Atividades", icon: CalendarCheck },
  { href: "/propostas", label: "Propostas", icon: FileText },
  { href: "/receitas", label: "Receitas", icon: CircleDollarSign },
  { href: "/clientes", label: "Clientes", icon: HeartHandshake },
  { href: "/automacoes", label: "Automações", icon: Workflow },
  { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
  { href: "/assistente", label: "Assistente IA", icon: Bot },
  { href: "/configuracoes/privacidade", label: "Privacidade", icon: ShieldCheck, permission: "privacy:read" },
];

function Navigation({ actor }: { actor: TenantActor }) {
  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {navigation.filter((item) => !item.permission || can(actor.role, item.permission)).map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
          <Icon size={18} className="text-slate-500 transition group-hover:text-amber-400" />{label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ actor, children }: { actor: TenantActor; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 px-4 py-6 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-500 text-lg font-black text-slate-950">T</span>
          <span><strong className="block text-sm tracking-wide text-white">TUPINIQUIM</strong><span className="text-xs text-slate-400">CRM comercial</span></span>
        </Link>
        <div className="my-6 h-px bg-white/10" />
        <Navigation actor={actor} />
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-amber-400 text-xs font-bold text-slate-950">{initials(actor.organizationName)}</span><span className="min-w-0"><strong className="block truncate text-xs text-white">{actor.organizationName}</strong><span className="text-[11px] text-slate-400">{actor.role}</span></span><ChevronDown className="ml-auto text-slate-500" size={15} /></div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <details className="relative lg:hidden"><summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200"><Menu size={20} /></summary><div className="absolute left-0 top-12 w-64 rounded-2xl bg-slate-950 p-4 shadow-2xl"><Navigation actor={actor} /></div></details>
          <div className="relative hidden max-w-md flex-1 sm:block"><Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} /><input aria-label="Busca global" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20" placeholder="Buscar empresas, leads e propostas..." /></div>
          <div className="ml-auto flex items-center gap-2"><Link aria-label="Relatórios" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" href="/relatorios"><ChartNoAxesCombined size={19} /></Link>{can(actor.role, "privacy:read") && <Link aria-label="Configurações de privacidade" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" href="/configuracoes/privacidade"><Settings2 size={19} /></Link>}<button aria-label="Notificações" className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" /></button></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
