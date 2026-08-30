import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { assertPermission, tenantWhere, type TenantActor } from "@/modules/shared/tenant";
import { calculateProposal, canTransitionProposal, proposalSchema } from "./domain";

export async function listProposals(actor: TenantActor) {
  assertPermission(actor, "crm:read");
  return prisma.proposal.findMany({
    where: tenantWhere(actor),
    include: { company: true, opportunity: true, items: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProposal(actor: TenantActor, raw: unknown) {
  assertPermission(actor, "proposal:write");
  const data = proposalSchema.parse(raw);
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: data.opportunityId, companyId: data.companyId, organizationId: actor.organizationId },
  });
  if (!opportunity) throw new Error("Oportunidade inválida para a organização ativa.");
  const amounts = calculateProposal(data.items, data.discount);
  const last = await prisma.proposal.findFirst({
    where: tenantWhere(actor),
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const proposal = await prisma.proposal.create({
    data: {
      organizationId: actor.organizationId,
      companyId: data.companyId,
      opportunityId: data.opportunityId,
      number: (last?.number ?? 0) + 1,
      title: data.title,
      validUntil: data.validUntil,
      ...amounts,
      items: {
        create: data.items.map((item, index) => ({
          ...item,
          productId: item.productId || null,
          total: item.quantity * item.unitPrice,
          position: index + 1,
        })),
      },
    },
  });
  await recordAudit(actor, { action: "proposal.created", entityType: "Proposal", entityId: proposal.id, after: { number: proposal.number, version: proposal.version, total: Number(proposal.total), status: proposal.status } });
  return proposal;
}

export async function transitionProposal(actor: TenantActor, proposalId: string, targetStatus: string) {
  const proposal = await prisma.proposal.findFirst({ where: { id: proposalId, organizationId: actor.organizationId } });
  if (!proposal) throw new Error("Proposta não encontrada.");
  if (!canTransitionProposal(proposal.status, targetStatus)) throw new Error("Transição de proposta inválida.");
  if (targetStatus === "APPROVED") assertPermission(actor, "proposal:approve");
  else assertPermission(actor, "proposal:write");
  const updated = await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: targetStatus as "PENDING_APPROVAL" | "APPROVED" | "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED",
      ...(targetStatus === "APPROVED" ? { approvedById: actor.userId, approvedAt: new Date() } : {}),
      ...(targetStatus === "SENT" ? { sentAt: new Date() } : {}),
      ...(targetStatus === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
    },
  });
  await recordAudit(actor, { action: "proposal.transitioned", entityType: "Proposal", entityId: updated.id, before: { status: proposal.status }, after: { status: updated.status } });
  return updated;
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function simulateProposalSend(actor: TenantActor, proposalId: string, recipient: string) {
  assertPermission(actor, "proposal:write");
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({ where: { id: proposalId, organizationId: actor.organizationId } });
    if (!proposal || proposal.status !== "APPROVED") throw new Error("Somente propostas aprovadas podem ser enviadas.");
    await tx.proposalAccessToken.create({ data: { organizationId: actor.organizationId, proposalId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } });
    await tx.outboundSimulation.create({ data: { organizationId: actor.organizationId, proposalId, channel: "EMAIL", recipient, status: "SIMULATED", payload: { subject: proposal.title, approvalRequired: true } } });
    await tx.proposal.update({ where: { id: proposal.id }, data: { status: "SENT", sentAt: new Date() } });
  });
  return { token, path: `/proposta/${token}` };
}

export async function getProposalByAccessToken(token: string) {
  return prisma.proposalAccessToken.findFirst({
    where: { tokenHash: tokenHash(token), revokedAt: null, expiresAt: { gt: new Date() } },
    include: { proposal: { include: { company: true, items: true } } },
  });
}

export async function acceptProposal(actor: TenantActor, proposalId: string) {
  assertPermission(actor, "proposal:approve");
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, organizationId: actor.organizationId },
      include: { contract: true },
    });
    if (!proposal) throw new Error("Proposta não encontrada.");
    if (proposal.contract) return proposal.contract;
    if (proposal.status !== "SENT" && proposal.status !== "APPROVED") throw new Error("A proposta precisa estar aprovada ou enviada.");

    const contract = await tx.contract.create({
      data: {
        organizationId: actor.organizationId, companyId: proposal.companyId, proposalId: proposal.id,
        number: `CT-${String(proposal.number).padStart(4, "0")}-V${proposal.version}`,
        startsAt: new Date(), amount: proposal.total,
      },
    });
    await Promise.all([
      tx.proposal.update({ where: { id: proposal.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } }),
      tx.opportunity.update({ where: { id: proposal.opportunityId }, data: { status: "WON" } }),
      tx.company.update({ where: { id: proposal.companyId }, data: { lifecycle: "CUSTOMER" } }),
      tx.revenue.create({ data: { organizationId: actor.organizationId, companyId: proposal.companyId, opportunityId: proposal.opportunityId, contractId: contract.id, type: "PROJECT", status: "ACTIVE", description: proposal.title, amount: proposal.total, startsAt: new Date() } }),
    ]);
    return contract;
  });
}
