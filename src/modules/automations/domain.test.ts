import { describe, expect, it } from "vitest";
import { automationDefinitionSchema, conditionsMatch, retryAt, stableKey } from "./domain";

describe("automation domain", () => {
  it("validates a versioned trigger/condition/action definition", () => {
    const result = automationDefinitionSchema.parse({
      name: "Lead qualificado",
      triggerType: "LEAD_CREATED",
      conditions: [{ field: "lead.score", operator: "GREATER_OR_EQUAL", value: 70 }],
      actions: [{ type: "CREATE_TASK", title: "Fazer contato" }],
    });
    expect(result.actions[0].type).toBe("CREATE_TASK");
  });

  it("evaluates all conditions without executing actions", () => {
    const payload = { lead: { score: 82, source: "Evento" } };
    expect(conditionsMatch(payload, [
      { field: "lead.score", operator: "GREATER_OR_EQUAL", value: 70 },
      { field: "lead.source", operator: "CONTAINS", value: "evento" },
    ])).toBe(true);
  });

  it("creates stable idempotency keys and bounded retry delays", () => {
    expect(stableKey("run", 1)).toBe(stableKey("run", 1));
    const now = new Date("2026-08-13T12:00:00.000Z");
    expect(retryAt(2, now).toISOString()).toBe("2026-08-13T12:04:00.000Z");
    expect(retryAt(20, now).toISOString()).toBe("2026-08-13T13:00:00.000Z");
  });
});
