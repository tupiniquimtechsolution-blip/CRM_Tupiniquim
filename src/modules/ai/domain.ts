import { z } from "zod";

export const aiAssistKinds = ["CUSTOMER_SUMMARY", "LEAD_CLASSIFICATION", "MESSAGE_DRAFT"] as const;

export const aiAssistOutputSchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(3).max(2_000),
  classification: z.enum(["HOT", "WARM", "COLD", "NOT_APPLICABLE"]).nullable(),
  confidence: z.number().int().min(0).max(100).nullable(),
  highlights: z.array(z.string().max(240)).max(8),
  risks: z.array(z.string().max(240)).max(8),
  suggestedNextStep: z.string().min(3).max(500),
  draftSubject: z.string().max(160).nullable(),
  draftBody: z.string().max(3_000).nullable(),
  tone: z.string().max(80).nullable(),
  warnings: z.array(z.string().max(240)).max(8),
  needsHumanReview: z.literal(true),
});

export type AiAssistKind = (typeof aiAssistKinds)[number];
export type AiAssistOutput = z.infer<typeof aiAssistOutputSchema>;

export function deterministicAssist(kind: AiAssistKind, context: Record<string, unknown>): AiAssistOutput {
  const name = String(context.name ?? context.title ?? "Registro");
  if (kind === "LEAD_CLASSIFICATION") {
    const score = Number(context.score ?? 0);
    const classification = score >= 75 ? "HOT" : score >= 45 ? "WARM" : "COLD";
    return { title: `Classificação de ${name}`, summary: `Classificação baseada no score e no estágio registrados no CRM.`, classification, confidence: Math.min(95, Math.max(50, score)), highlights: [`Score registrado: ${score}`], risks: score < 45 ? ["Baixo sinal de intenção no registro atual."] : [], suggestedNextStep: "Revisar os dados e confirmar a prioridade antes de abordar o lead.", draftSubject: null, draftBody: null, tone: null, warnings: ["Resultado simulado para testes; requer revisão humana."], needsHumanReview: true };
  }
  if (kind === "MESSAGE_DRAFT") {
    return { title: `Rascunho para ${name}`, summary: "Rascunho comercial criado a partir dos dados autorizados do CRM.", classification: null, confidence: null, highlights: [], risks: [], suggestedNextStep: "Revisar destinatário, contexto e oferta antes de aprovar.", draftSubject: `Próximos passos com ${name}`, draftBody: `Olá,\n\npreparamos os próximos passos para dar continuidade ao atendimento de ${name}. Podemos alinhar os detalhes em uma conversa breve?\n\nAtenciosamente,\nEquipe Tupiniquim`, tone: "Profissional e cordial", warnings: ["Nenhuma mensagem foi enviada."], needsHumanReview: true };
  }
  return { title: `Resumo de ${name}`, summary: "Visão sintética da conta com base nos registros autorizados do CRM.", classification: null, confidence: null, highlights: ["Dados comerciais e de atendimento consolidados."], risks: Array.isArray(context.risks) ? context.risks.map(String).slice(0, 5) : [], suggestedNextStep: "Validar os riscos e registrar a próxima atividade da conta.", draftSubject: null, draftBody: null, tone: null, warnings: ["Resumo simulado para testes; requer revisão humana."], needsHumanReview: true };
}
