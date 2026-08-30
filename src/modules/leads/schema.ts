import { z } from "zod";

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export const leadSchema = z.object({
  companyId: z.string().min(1, "Todo lead precisa de uma empresa identificada."),
  title: z.string().trim().min(3),
  source: z.string().trim().min(2, "Informe a origem do lead."),
  validationSource: z.string().trim().min(2, "Informe a fonte usada para validar a empresa."),
  assignedToId: z.string().optional(),
  score: z.coerce.number().int().min(0).max(100).default(0),
  notes: z.string().trim().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const importLeadRowSchema = z.object({
  empresa: z.string().trim().min(2),
  origem: z.string().trim().min(2),
  fonte_validacao: z.string().trim().min(2),
  contato: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().transform(normalizePhone).optional(),
  segmento: z.string().trim().optional(),
});
