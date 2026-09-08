"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { executePrivacyRequestAction, previewPrivacyRequestAction } from "./actions";

type Preview = {
  token: string;
  expiresAt: string;
  counts: Record<string, number>;
};

export function PrivacyExportControls({ requestId, requestType }: { requestId: string; requestType: "CONFIRMATION_ACCESS" | "PORTABILITY" }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generatePreview() {
    startTransition(async () => {
      try {
        setError(null);
        setPreview(await previewPrivacyRequestAction(requestId));
      } catch (cause) {
        setPreview(null);
        setError(cause instanceof Error ? cause.message : "Falha ao gerar preview.");
      }
    });
  }

  function executeAndDownload() {
    if (!preview) return;
    startTransition(async () => {
      try {
        setError(null);
        const result = await executePrivacyRequestAction(requestId, preview.token);
        const blob = new Blob([JSON.stringify(result.packageData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setPreview(null);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha ao executar a solicitação.");
      }
    });
  }

  const total = preview ? Object.values(preview.counts).reduce((sum, value) => sum + value, 0) : 0;
  return <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
    <p className="text-xs font-semibold text-blue-950">
      {requestType === "PORTABILITY" ? "Portabilidade JSON" : "Pacote de acesso"}: preview obrigatório antes da conclusão.
    </p>
    <div className="mt-2 flex flex-wrap gap-2">
      <button className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-900 disabled:opacity-50" disabled={pending} onClick={generatePreview} type="button">
        {pending ? "Processando..." : "Gerar preview"}
      </button>
      {preview ? <button className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" disabled={pending} onClick={executeAndDownload} type="button">
        Executar e baixar JSON
      </button> : null}
    </div>
    {preview ? <p className="mt-2 text-[11px] text-blue-900">Preview válido até {new Date(preview.expiresAt).toLocaleTimeString("pt-BR")} · {total} registros estruturados.</p> : null}
    {error ? <p className="mt-2 text-[11px] font-semibold text-red-700" role="alert">{error}</p> : null}
  </div>;
}
