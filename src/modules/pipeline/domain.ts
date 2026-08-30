import { z } from "zod";

export const opportunitySchema = z.object({
  companyId: z.string().min(1),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  title: z.string().trim().min(3),
  value: z.coerce.number().positive(),
  expectedCloseAt: z.coerce.date().optional(),
});

export function validateOpportunityOutcome(status: "OPEN" | "WON" | "LOST", lostReason?: string | null) {
  if (status === "LOST" && !lostReason?.trim()) {
    throw new Error("O motivo da perda é obrigatório.");
  }
  if (status !== "LOST" && lostReason) {
    throw new Error("Motivo de perda só pode ser informado em oportunidades perdidas.");
  }
}
