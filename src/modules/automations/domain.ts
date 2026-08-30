import { createHash } from "node:crypto";
import { z } from "zod";

export const automationTriggerTypes = [
  "LEAD_CREATED",
  "OPPORTUNITY_STAGE_CHANGED",
  "ACTIVITY_COMPLETED",
  "FOLLOW_UP_DUE",
  "PROPOSAL_ACCEPTED",
  "CUSTOMER_INACTIVE",
  "RENEWAL_DUE",
  "WEBHOOK_RECEIVED",
  "CAPTURE_FORM_SUBMITTED",
  "SCHEDULED",
] as const;

export const conditionSchema = z.object({
  field: z.string().min(1).max(100),
  operator: z.enum(["EQUALS", "NOT_EQUALS", "CONTAINS", "GREATER_OR_EQUAL", "LESS_OR_EQUAL", "EXISTS"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("CREATE_TASK"), title: z.string().min(3).max(160), dueInHours: z.number().int().min(0).max(8_760).default(24), assignedToId: z.string().optional() }),
  z.object({ type: z.literal("CREATE_NOTIFICATION"), title: z.string().min(3).max(160), body: z.string().max(1_000).optional(), userId: z.string().optional() }),
  z.object({ type: z.literal("ASSIGN_OWNER"), entity: z.enum(["LEAD", "OPPORTUNITY"]), ownerId: z.string().min(1) }),
  z.object({ type: z.literal("CHANGE_STAGE"), stageId: z.string().min(1) }),
  z.object({ type: z.literal("ADD_TAG"), tagId: z.string().min(1) }),
  z.object({ type: z.literal("PREPARE_MESSAGE"), provider: z.enum(["EMAIL", "WHATSAPP"]), templateId: z.string().optional(), recipientField: z.string().default("contact.email") }),
  z.object({ type: z.literal("PREPARE_WEBHOOK"), recipientField: z.string().default("callbackUrl") }),
]);

export const automationDefinitionSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  triggerType: z.enum(automationTriggerTypes),
  triggerConfig: z.record(z.string(), z.unknown()).default({}),
  conditions: z.array(conditionSchema).max(20).default([]),
  actions: z.array(actionSchema).min(1).max(20),
});

export type AutomationDefinition = z.infer<typeof automationDefinitionSchema>;
export type AutomationAction = z.infer<typeof actionSchema>;
export type AutomationCondition = z.infer<typeof conditionSchema>;

export function readPayloadPath(payload: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, payload);
}

function comparable(value: unknown) {
  if (typeof value === "string") return value.trim().toLocaleLowerCase("pt-BR");
  return value;
}

export function conditionMatches(payload: unknown, condition: AutomationCondition) {
  const actual = readPayloadPath(payload, condition.field);
  const expected = condition.value;
  switch (condition.operator) {
    case "EXISTS": return actual !== undefined && actual !== null && actual !== "";
    case "EQUALS": return comparable(actual) === comparable(expected);
    case "NOT_EQUALS": return comparable(actual) !== comparable(expected);
    case "CONTAINS": return String(actual ?? "").toLocaleLowerCase("pt-BR").includes(String(expected ?? "").toLocaleLowerCase("pt-BR"));
    case "GREATER_OR_EQUAL": return Number(actual) >= Number(expected);
    case "LESS_OR_EQUAL": return Number(actual) <= Number(expected);
  }
}

export function conditionsMatch(payload: unknown, conditions: AutomationCondition[]) {
  return conditions.every((condition) => conditionMatches(payload, condition));
}

export function stableKey(...parts: Array<string | number>) {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex");
}

export function retryAt(attempt: number, now = new Date()) {
  const delayMinutes = Math.min(60, 2 ** Math.max(0, attempt));
  return new Date(now.getTime() + delayMinutes * 60_000);
}
