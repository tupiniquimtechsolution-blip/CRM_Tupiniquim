import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2, "Informe a razão social ou nome da empresa."),
  tradeName: z.string().trim().optional(),
  document: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  segment: z.string().trim().min(2),
  source: z.string().trim().min(2),
});

export type CompanyInput = z.infer<typeof companySchema>;
