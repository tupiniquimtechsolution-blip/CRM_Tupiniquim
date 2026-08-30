import { describe, expect, it } from "vitest";
import { calculateProposal, canTransitionProposal } from "./domain";

describe("propostas", () => {
  it("calcula subtotal, desconto e total", () => {
    expect(calculateProposal([{ quantity: 2, unitPrice: 1000 }, { quantity: 1, unitPrice: 500 }], 250)).toEqual({ subtotal: 2500, discount: 250, total: 2250 });
  });

  it("impede desconto maior que o subtotal", () => {
    expect(() => calculateProposal([{ quantity: 1, unitPrice: 100 }], 101)).toThrow(/desconto/i);
  });

  it("obriga o fluxo de aprovação antes do envio", () => {
    expect(canTransitionProposal("DRAFT", "SENT")).toBe(false);
    expect(canTransitionProposal("DRAFT", "PENDING_APPROVAL")).toBe(true);
    expect(canTransitionProposal("APPROVED", "SENT")).toBe(true);
  });
});
