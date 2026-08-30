import { randomUUID } from "node:crypto";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCaptureForm } from "@/modules/integrations/service";

type CaptureField = { name: string; label: string; type: string; required?: boolean };

export default async function CapturePage({ params, searchParams }: { params: Promise<{ publicId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { publicId } = await params;
  const query = await searchParams;
  const form = await getPublicCaptureForm(publicId);
  if (!form) notFound();
  const fields = Array.isArray(form.fields) ? form.fields.filter((field): field is CaptureField => Boolean(field && typeof field === "object" && "name" in field && "label" in field && "type" in field)) : [];
  const sent = query.enviado === "1";
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-950 sm:py-20">
      <section className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="bg-amber-400 p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.2em]">Tupiniquim CRM</p><h1 className="mt-3 text-3xl font-black">{form.name}</h1>{form.description && <p className="mt-3 text-sm leading-6 text-slate-700">{form.description}</p>}</header>
        {sent ? <div className="p-9 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={48} /><h2 className="mt-5 text-xl font-bold">Recebemos seus dados</h2><p className="mt-2 text-sm leading-6 text-slate-500">O registro foi criado com segurança e a equipe entrará em contato.</p></div> : (
          <form action={`/api/capture/${publicId}`} className="grid gap-5 p-7 sm:p-9" method="post">
            <input name="submissionId" type="hidden" value={randomUUID()} />
            <input name="privacyNoticeVersion" type="hidden" value="2026-08" />
            {fields.map((field) => <label className="grid gap-2 text-sm font-bold" key={field.name}>{field.label}{field.type === "textarea" ? <textarea className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" name={field.name} required={field.required} /> : <input className="h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" name={field.name} required={field.required} type={field.type} />}</label>)}
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs font-normal leading-5 text-slate-600"><input className="mt-1 size-4 shrink-0 accent-amber-500" name="privacyConsent" required type="checkbox" />Autorizo o uso destes dados para responder à minha solicitação e conduzir o atendimento comercial. Li o <Link className="font-bold text-blue-700 underline" href="/privacidade" target="_blank">aviso de privacidade</Link>.</label>
            <button className="mt-2 h-12 rounded-xl bg-slate-950 font-bold text-white transition hover:bg-slate-800">Enviar com segurança</button>
            <p className="text-center text-[11px] leading-5 text-slate-400">Consentimento registrado com finalidade, versão do aviso e evidência pseudonimizada.</p>
          </form>
        )}
      </section>
    </main>
  );
}
