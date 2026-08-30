import { z } from "zod";

export const proposalItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().trim().min(2),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const proposalSchema = z.object({
  companyId: z.string().min(1),
  opportunityId: z.string().min(1),
  title: z.string().trim().min(3),
  discount: z.coerce.number().min(0).default(0),
  validUntil: z.coerce.date().optional(),
  items: z.array(proposalItemSchema).min(1),
});

export function calculateProposal(
  items: Array<{ quantity: number; unitPrice: number }>,
  discount = 0,
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (discount > subtotal) throw new Error("O desconto não pode superar o subtotal.");
  return { subtotal, discount, total: subtotal - discount };
}

export function canTransitionProposal(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    DRAFT: ["PENDING_APPROVAL"],
    PENDING_APPROVAL: ["APPROVED", "DRAFT"],
    APPROVED: ["SENT"],
    SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  };
  return transitions[from]?.includes(to) ?? false;
}
