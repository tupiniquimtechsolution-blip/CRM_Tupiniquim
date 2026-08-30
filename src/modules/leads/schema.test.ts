import { describe, expect, it } from "vitest";
import { leadSchema, normalizePhone } from "./schema";

describe("validação de leads", () => {
  it("não valida lead sem empresa e fonte de validação", () => {
    const result = leadSchema.safeParse({ title: "Novo projeto", source: "Evento", companyId: "", validationSource: "" });
    expect(result.success).toBe(false);
  });

  it("normaliza telefone brasileiro", () => {
    expect(normalizePhone("(11) 99999-0000")).toBe("+5511999990000");
    expect(normalizePhone("+55 21 98888-7777")).toBe("+5521988887777");
  });
});
