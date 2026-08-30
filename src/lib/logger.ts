type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  const record = { timestamp: new Date().toISOString(), level, service: "crm-tupiniquim", event, ...context };
  const serialized = JSON.stringify(record, (_key, value) => value instanceof Error ? { name: value.name, message: value.message } : value);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.info(serialized);
}
