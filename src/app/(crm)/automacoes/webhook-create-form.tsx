"use client";

import { useActionState } from "react";
import { fieldClass, labelClass, submitClass } from "@/components/quick-create";
import { createWebhookEndpointAction, type WebhookCreateState } from "./actions";

const initialState: WebhookCreateState = {};

export function WebhookCreateForm() {
  const [state, action, pending] = useActionState(createWebhookEndpointAction, initialState);
  return <div className="grid gap-3"><form action={action} className="grid gap-3"><label className={labelClass}>Nome do endpoint *<input className={fieldClass} name="name" required /></label><button className={submitClass} disabled={pending}>{pending ? "Criando..." : "Criar endpoint"}</button></form>{state.error && <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{state.error}</p>}{state.token && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><strong className="block">Copie agora: o token não será mostrado novamente.</strong><code className="mt-2 block break-all rounded-lg bg-white p-2 select-all">{state.token}</code><p className="mt-2">Endpoint: <code>/api/webhooks/{state.publicId}</code></p></div>}</div>;
}
