import { describe, expect, it } from "vitest";
import { aiAssistOutputSchema, deterministicAssist } from "./domain";

describe("AI assist domain", () => {
  it("always marks generated content for human review", () => {
    const output = deterministicAssist("LEAD_CLASSIFICATION", { name: "Lead sintético", score: 82 });
    expect(output.classification).toBe("HOT");
    expect(output.needsHumanReview).toBe(true);
    expect(aiAssistOutputSchema.parse(output)).toEqual(output);
  });

  it("creates drafts without sending anything", () => {
    const output = deterministicAssist("MESSAGE_DRAFT", { name: "Empresa demonstração" });
    expect(output.draftBody).toContain("Equipe Tupiniquim");
    expect(output.warnings).toContain("Nenhuma mensagem foi enviada.");
  });
});
