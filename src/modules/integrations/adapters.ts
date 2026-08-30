import { randomUUID } from "node:crypto";

export type ApprovedOutbound = {
  provider: "EMAIL" | "CALENDAR" | "WHATSAPP" | "WEBHOOK";
  recipient: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
};

export type AdapterResult = {
  externalId: string;
  mode: "SANDBOX";
  acceptedAt: string;
};

export interface IntegrationAdapter {
  deliver(message: ApprovedOutbound): Promise<AdapterResult>;
}

class SandboxAdapter implements IntegrationAdapter {
  constructor(private readonly channel: ApprovedOutbound["provider"]) {}

  async deliver(message: ApprovedOutbound): Promise<AdapterResult> {
    if (!message.recipient.trim()) throw new Error("Destinatário obrigatório.");
    return {
      externalId: `sandbox:${this.channel.toLocaleLowerCase()}:${randomUUID()}`,
      mode: "SANDBOX",
      acceptedAt: new Date().toISOString(),
    };
  }
}

export function integrationAdapter(provider: ApprovedOutbound["provider"]): IntegrationAdapter {
  return new SandboxAdapter(provider);
}
