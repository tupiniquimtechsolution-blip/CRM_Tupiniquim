"use server";

import { revalidatePath } from "next/cache";
import { getCurrentActor } from "@/lib/current-actor";
import { createAiAssistRequest, reviewAiAssistRequest } from "@/modules/ai/service";

function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }

export async function createAiAssistAction(formData: FormData) {
  await createAiAssistRequest(await getCurrentActor(), { kind: value(formData, "kind"), entityId: value(formData, "entityId") });
  revalidatePath("/assistente");
}

export async function reviewAiAssistAction(formData: FormData) {
  await reviewAiAssistRequest(await getCurrentActor(), value(formData, "requestId"), value(formData, "decision") === "APPROVE");
  revalidatePath("/assistente");
}
