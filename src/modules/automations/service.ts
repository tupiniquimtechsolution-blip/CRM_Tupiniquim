import type { Prisma } from "@/generated/prisma/client";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requestOutboundApproval } from "@/modules/integrations/service";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { actionSchema, automationDefinitionSchema, conditionsMatch, readPayloadPath, retryAt, stableKey, type AutomationAction } from "./domain";

type AutomationEvent = {
  organizationId: string;
  triggerType: "LEAD_CREATED" | "OPPORTUNITY_STAGE_CHANGED" | "ACTIVITY_COMPLETED" | "FOLLOW_UP_DUE" | "PROPOSAL_ACCEPTED" | "CUSTOMER_INACTIVE" | "RENEWAL_DUE" | "WEBHOOK_RECEIVED" | "CAPTURE_FORM_SUBMITTED" | "SCHEDULED";
  eventKey: string;
  payload: Prisma.InputJsonValue;
};

function json(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function payloadId(payload: unknown, name: "company" | "lead" | "opportunity") {
  const direct = readPayloadPath(payload, `${name}Id`);
  const nested = readPayloadPath(payload, `${name}.id`);
  const value = direct ?? nested;
  return typeof value === "string" && value ? value : undefined;
}

async function requireMember(organizationId: string, userId: string) {
  const member = await prisma.membership.findFirst({ where: { organizationId, userId, status: "ACTIVE" } });
  if (!member) throw new Error("Responsável não pertence à organização.");
}

export async function listAutomationWorkspace(actor: TenantActor) {
  assertPermission(actor, "automation:read");
  const [automations, runs] = await Promise.all([
    prisma.automation.findMany({
      where: tenantWhere(actor),
      include: { versions: { orderBy: { version: "desc" }, take: 1 }, runs: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.automationRun.findMany({
      where: tenantWhere(actor),
      include: { automation: true, actionLogs: { orderBy: { actionIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  return { automations, runs };
}

export async function createAutomation(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "automation:write");
  const definition = automationDefinitionSchema.parse(raw);
  const automation = await prisma.automation.create({
    data: {
      organizationId: actor.organizationId,
      name: definition.name,
      description: definition.description || null,
      triggerType: definition.triggerType,
      createdById: actor.userId,
      versions: {
        create: {
          organizationId: actor.organizationId,
          version: 1,
          triggerConfig: json(definition.triggerConfig),
          conditions: json(definition.conditions),
          actions: json(definition.actions),
          createdById: actor.userId,
        },
      },
    },
    include: { versions: true },
  });
  await recordAudit(actor, { action: "automation.created", entityType: "Automation", entityId: automation.id, after: { name: automation.name, version: 1, triggerType: automation.triggerType } });
  return automation;
}

export async function publishAutomation(actor: TenantActor, automationId: string) {
  assertPermission(actor, "automation:publish");
  const automation = await prisma.automation.findFirst({ where: { id: automationId, organizationId: actor.organizationId }, include: { versions: { where: { version: { equals: 1 } } } } });
  if (!automation) throw new Error("Automação não encontrada.");
  const version = await prisma.automationVersion.findUnique({ where: { automationId_version: { automationId: automation.id, version: automation.currentVersion } } });
  if (!version) throw new Error("Versão da automação não encontrada.");
  const updated = await prisma.$transaction(async (tx) => {
    await tx.automationVersion.update({ where: { id: version.id }, data: { publishedAt: new Date() } });
    return tx.automation.update({ where: { id: automation.id }, data: { status: "PUBLISHED" } });
  });
  await recordAudit(actor, { action: "automation.published", entityType: "Automation", entityId: updated.id, before: { status: automation.status }, after: { status: updated.status, version: updated.currentVersion } });
  return updated;
}

async function executeAction(input: {
  organizationId: string;
  requestedById: string;
  runId: string;
  actionIndex: number;
  action: AutomationAction;
  payload: Prisma.JsonValue;
}) {
  const { action, organizationId, payload, requestedById } = input;
  const companyId = payloadId(payload, "company");
  const leadId = payloadId(payload, "lead");
  const opportunityId = payloadId(payload, "opportunity");

  if (action.type === "CREATE_TASK") {
    const assignedToId = action.assignedToId || requestedById;
    await requireMember(organizationId, assignedToId);
    if (companyId && !await prisma.company.findFirst({ where: { id: companyId, organizationId }, select: { id: true } })) throw new Error("Empresa do evento não pertence à organização.");
    if (leadId && !await prisma.lead.findFirst({ where: { id: leadId, organizationId }, select: { id: true } })) throw new Error("Lead do evento não pertence à organização.");
    if (opportunityId && !await prisma.opportunity.findFirst({ where: { id: opportunityId, organizationId }, select: { id: true } })) throw new Error("Oportunidade do evento não pertence à organização.");
    const activity = await prisma.activity.create({
      data: { organizationId, companyId, leadId, opportunityId, assignedToId, createdById: requestedById, type: "TASK", title: action.title, dueAt: new Date(Date.now() + action.dueInHours * 3_600_000) },
    });
    return { status: "SUCCEEDED" as const, output: { activityId: activity.id } };
  }

  if (action.type === "CREATE_NOTIFICATION") {
    const userId = action.userId || requestedById;
    await requireMember(organizationId, userId);
    const notification = await prisma.notification.create({ data: { organizationId, userId, type: "SYSTEM", title: action.title, body: action.body || null } });
    return { status: "SUCCEEDED" as const, output: { notificationId: notification.id } };
  }

  if (action.type === "ASSIGN_OWNER") {
    await requireMember(organizationId, action.ownerId);
    if (action.entity === "LEAD") {
      if (!leadId) throw new Error("Evento sem lead para atribuição.");
      const result = await prisma.lead.updateMany({ where: { id: leadId, organizationId }, data: { assignedToId: action.ownerId } });
      if (!result.count) throw new Error("Lead não encontrado na organização.");
    } else {
      if (!opportunityId) throw new Error("Evento sem oportunidade para atribuição.");
      const result = await prisma.opportunity.updateMany({ where: { id: opportunityId, organizationId }, data: { ownerId: action.ownerId } });
      if (!result.count) throw new Error("Oportunidade não encontrada na organização.");
    }
    return { status: "SUCCEEDED" as const, output: { ownerId: action.ownerId } };
  }

  if (action.type === "CHANGE_STAGE") {
    if (!opportunityId) throw new Error("Evento sem oportunidade para mudança de etapa.");
    const [opportunity, stage] = await Promise.all([
      prisma.opportunity.findFirst({ where: { id: opportunityId, organizationId } }),
      prisma.pipelineStage.findFirst({ where: { id: action.stageId, pipeline: { organizationId } } }),
    ]);
    if (!opportunity || !stage || opportunity.pipelineId !== stage.pipelineId) throw new Error("Oportunidade ou etapa inválida para a organização.");
    await prisma.$transaction([
      prisma.opportunity.update({ where: { id: opportunity.id }, data: { stageId: stage.id } }),
      prisma.opportunityStageHistory.create({ data: { opportunityId: opportunity.id, fromStageId: opportunity.stageId, toStageId: stage.id, changedById: requestedById } }),
    ]);
    return { status: "SUCCEEDED" as const, output: { stageId: stage.id } };
  }

  if (action.type === "ADD_TAG") {
    if (!leadId) throw new Error("Evento sem lead para etiqueta.");
    const [lead, tag] = await Promise.all([
      prisma.lead.findFirst({ where: { id: leadId, organizationId }, select: { id: true } }),
      prisma.tag.findFirst({ where: { id: action.tagId, organizationId }, select: { id: true } }),
    ]);
    if (!lead || !tag) throw new Error("Lead ou etiqueta inválida para a organização.");
    await prisma.leadTag.upsert({ where: { leadId_tagId: { leadId, tagId: tag.id } }, update: {}, create: { leadId, tagId: tag.id } });
    return { status: "SUCCEEDED" as const, output: { tagId: tag.id } };
  }

  const idempotencyKey = stableKey(input.runId, input.actionIndex, action.type);
  if (action.type === "PREPARE_MESSAGE") {
    const recipient = readPayloadPath(payload, action.recipientField);
    if (typeof recipient !== "string" || !recipient.trim()) throw new Error("Destinatário ausente no evento.");
    const approval = await requestOutboundApproval({ organizationId, requestedById, provider: action.provider, recipient, payload: json({ event: payload, action: action.type }), idempotencyKey, templateId: action.templateId });
    return { status: "AWAITING_APPROVAL" as const, output: { approvalId: approval.id } };
  }

  const recipient = readPayloadPath(payload, action.recipientField);
  if (typeof recipient !== "string" || !recipient.startsWith("https://")) throw new Error("URL HTTPS de callback ausente ou inválida.");
  const approval = await requestOutboundApproval({ organizationId, requestedById, provider: "WEBHOOK", recipient, payload: json({ event: payload, action: action.type }), idempotencyKey });
  return { status: "AWAITING_APPROVAL" as const, output: { approvalId: approval.id } };
}

export async function processAutomationRun(organizationId: string, runId: string) {
  const run = await prisma.automationRun.findFirst({ where: { id: runId, organizationId }, include: { automation: true, version: true, actionLogs: true } });
  if (!run) throw new Error("Execução de automação não encontrada.");
  if (run.status === "SUCCEEDED" || run.status === "CANCELLED" || run.attempt >= run.maxAttempts) return run;
  const conditions = Array.isArray(run.version.conditions) ? run.version.conditions : [];
  const parsedConditions = automationDefinitionSchema.shape.conditions.parse(conditions);
  if (!conditionsMatch(run.triggerPayload, parsedConditions)) {
    return prisma.automationRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", startedAt: new Date(), finishedAt: new Date(), error: null } });
  }
  const actions = zodActions(run.version.actions);
  await prisma.automationRun.update({ where: { id: run.id }, data: { status: "RUNNING", startedAt: run.startedAt ?? new Date(), attempt: { increment: 1 }, error: null } });
  try {
    for (let actionIndex = 0; actionIndex < actions.length; actionIndex += 1) {
      const action = actions[actionIndex];
      const idempotencyKey = stableKey(run.id, actionIndex, action.type);
      const existing = await prisma.automationActionLog.findUnique({ where: { runId_actionIndex: { runId: run.id, actionIndex } } });
      if (existing && ["SUCCEEDED", "AWAITING_APPROVAL", "SKIPPED"].includes(existing.status)) continue;
      const log = existing
        ? await prisma.automationActionLog.update({ where: { id: existing.id }, data: { status: "RUNNING", attempt: { increment: 1 }, error: null, startedAt: new Date() } })
        : await prisma.automationActionLog.create({ data: { organizationId, runId: run.id, actionIndex, actionType: action.type, idempotencyKey, status: "RUNNING", attempt: 1, input: json(action), startedAt: new Date() } });
      try {
        const result = await executeAction({ organizationId, requestedById: run.version.createdById, runId: run.id, actionIndex, action, payload: run.triggerPayload });
        await prisma.automationActionLog.update({ where: { id: log.id }, data: { status: result.status, output: json(result.output), finishedAt: new Date() } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha desconhecida na ação.";
        await prisma.automationActionLog.update({ where: { id: log.id }, data: { status: "FAILED", error: message, finishedAt: new Date() } });
        throw error;
      }
    }
    return prisma.automationRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), nextAttemptAt: null, error: null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na execução.";
    const nextAttempt = run.attempt + 1 < run.maxAttempts ? retryAt(run.attempt + 1) : null;
    return prisma.automationRun.update({ where: { id: run.id }, data: { status: "FAILED", error: message, finishedAt: new Date(), nextAttemptAt: nextAttempt } });
  }
}

function zodActions(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) throw new Error("Versão sem lista de ações válida.");
  return value.map((action) => actionSchema.parse(action));
}

export async function dispatchAutomationEvent(event: AutomationEvent) {
  const automations = await prisma.automation.findMany({
    where: { organizationId: event.organizationId, status: "PUBLISHED", triggerType: event.triggerType },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  const runIds: string[] = [];
  for (const automation of automations) {
    const version = automation.versions.find((candidate) => candidate.version === automation.currentVersion) ?? automation.versions[0];
    if (!version?.publishedAt) continue;
    try {
      const run = await prisma.automationRun.create({ data: { organizationId: event.organizationId, automationId: automation.id, versionId: version.id, eventKey: event.eventKey, triggerPayload: event.payload } });
      runIds.push(run.id);
      await processAutomationRun(event.organizationId, run.id);
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002") throw error;
      const existing = await prisma.automationRun.findUnique({ where: { organizationId_automationId_eventKey: { organizationId: event.organizationId, automationId: automation.id, eventKey: event.eventKey } } });
      if (existing) runIds.push(existing.id);
    }
  }
  return runIds;
}

export async function retryAutomationRun(actor: TenantActor, runId: string) {
  assertPermission(actor, "automation:write");
  const run = await prisma.automationRun.findFirst({ where: { id: runId, organizationId: actor.organizationId } });
  if (!run) throw new Error("Execução não encontrada.");
  if (run.attempt >= run.maxAttempts) throw new Error("Limite de tentativas atingido.");
  await prisma.automationRun.update({ where: { id: run.id }, data: { status: "QUEUED", nextAttemptAt: new Date(), finishedAt: null } });
  const result = await processAutomationRun(actor.organizationId, run.id);
  await recordAudit(actor, { action: "automation.run.retried", entityType: "AutomationRun", entityId: run.id, after: { status: result.status, attempt: result.attempt } });
  return result;
}
