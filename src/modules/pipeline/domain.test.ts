import { describe, expect, it } from "vitest";
import { validateOpportunityOutcome } from "./domain";

describe("ciclo da oportunidade", () => {
  it("exige motivo ao perder", () => {
    expect(() => validateOpportunityOutcome("LOST")).toThrow(/motivo da perda/i);
  });

  it("aceita ganho sem motivo de perda", () => {
    expect(() => validateOpportunityOutcome("WON")).not.toThrow();
  });
});
