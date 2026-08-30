import { AuthError } from "next-auth";
import Link from "next/link";
import { signIn } from "@/auth";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-amber-500 text-xl font-black text-slate-950">T</span><div><strong className="block tracking-wider">TUPINIQUIM</strong><span className="text-xs text-slate-500">TECH SOLUTIONS</span></div></div>
        <div className="relative max-w-xl"><div className="absolute -left-20 -top-40 size-96 rounded-full bg-amber-500/10 blur-3xl" /><p className="relative text-xs font-bold uppercase tracking-[.2em] text-amber-400">CRM comercial</p><h1 className="relative mt-5 text-5xl font-bold leading-[1.08] tracking-tight">Relacionamentos fortes.<br />Receita previsível.</h1><p className="relative mt-6 max-w-lg text-lg leading-8 text-slate-400">Da prospecção à retenção, toda a operação comercial em um único lugar seguro e mensurável.</p></div>
        <p className="text-xs text-slate-600">© 2026 Tupiniquim Tech Solutions</p>
      </section>
      <section className="flex items-center justify-center bg-[#f5f5f2] p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5 sm:p-10">
          <div className="mb-8 lg:hidden"><span className="grid size-11 place-items-center rounded-xl bg-amber-500 text-xl font-black text-slate-950">T</span></div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-600">Acesso seguro</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Bem-vindo de volta</h2><p className="mt-2 text-sm text-slate-500">Entre com sua conta corporativa.</p>
          {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">E-mail ou senha inválidos.</p> : null}
          <form className="mt-7 space-y-5" action={async (formData) => { "use server"; try { await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: "/dashboard" }); } catch (cause) { if (cause instanceof AuthError) return; throw cause; } }}>
            <label className="block text-sm font-semibold text-slate-700">E-mail<input name="email" type="email" required autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" placeholder="voce@empresa.com.br" /></label>
            <label className="block text-sm font-semibold text-slate-700">Senha<input name="password" type="password" required minLength={8} autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" placeholder="••••••••" /></label>
            <div className="text-right"><Link className="text-xs font-semibold text-amber-700 hover:text-amber-600" href="/recuperar-acesso">Esqueci minha senha</Link></div>
            <button className="h-12 w-full rounded-xl bg-slate-950 font-bold text-white transition hover:bg-amber-500 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">Entrar no CRM</button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">Ao entrar, você concorda com os controles de segurança e auditoria da organização.</p>
        </div>
      </section>
    </main>
  );
}
