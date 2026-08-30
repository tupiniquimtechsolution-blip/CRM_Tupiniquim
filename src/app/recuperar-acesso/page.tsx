import Link from "next/link";
import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/modules/auth/recovery";

export const metadata = { title: "Recuperar acesso" };

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><span className="grid size-11 place-items-center rounded-xl bg-amber-500 text-xl font-black text-slate-950">T</span><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-amber-600">Recuperação segura</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Recuperar acesso</h1><p className="mt-2 text-sm leading-6 text-slate-500">Informe seu e-mail. A resposta será sempre genérica para não revelar contas existentes.</p>{sent ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Se a conta existir, as instruções foram registradas para envio pelo adaptador de e-mail.</p> : <form className="mt-6 space-y-4" action={async (formData) => { "use server"; await requestPasswordReset(String(formData.get("email") ?? "")); redirect("/recuperar-acesso?sent=1"); }}><label className="block text-sm font-semibold text-slate-700">E-mail<input className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-amber-500" type="email" name="email" required /></label><button className="h-12 w-full rounded-xl bg-slate-950 font-bold text-white hover:bg-amber-500 hover:text-slate-950">Solicitar recuperação</button></form>}<Link className="mt-6 block text-center text-sm font-semibold text-slate-500 hover:text-slate-900" href="/login">Voltar para o login</Link></section></main>;
}
