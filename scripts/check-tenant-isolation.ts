import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { listCompanies } from "../src/modules/companies/service";
import { createLead } from "../src/modules/leads/service";
import { createTicket, listCustomers } from "../src/modules/customers/service";
import { dispatchAutomationEvent, listAutomationWorkspace } from "../src/modules/automations/service";
import { listIntegrationWorkspace } from "../src/modules/integrations/service";
import { getCrmReport } from "../src/modules/reports/service";
import { listAiWorkspace } from "../src/modules/ai/service";
import { createPrivacyRequest, updatePrivacyRequest } from "../src/modules/privacy/service";
import { executePrivacyRequest, previewPrivacyRequest } from "../src/modules/privacy/execution";
import type { TenantActor } from "../src/modules/shared/tenant";

const main = await prisma.organization.findUniqueOrThrow({ where: { slug: "tupiniquim-tech" } });
const other = await prisma.organization.upsert({
  where: { slug: "teste-isolamento" },
  update: { name: "Tenant Isolado" },
  create: { name: "Tenant Isolado", slug: "teste-isolamento" },
});
const foreignCompany = await prisma.company.upsert({
  where: { organizationId_document: { organizationId: other.id, document: "99999999999999" } },
  update: { name: "Empresa de Outro Tenant", lifecycle: "CUSTOMER" },
  create: { organizationId: other.id, name: "Empresa de Outro Tenant", document: "99999999999999", segment: "Teste", source: "Teste de isolamento", lifecycle: "CUSTOMER" },
});
const foreignAutomation = await prisma.automation.upsert({
  where: { organizationId_name: { organizationId: other.id, name: "Automação de outro tenant" } },
  update: {},
  create: { organizationId: other.id, name: "Automação de outro tenant", triggerType: "LEAD_CREATED", createdById: "foreign-user" },
});
const foreignAiRequest = await prisma.aiAssistRequest.create({ data: { organizationId: other.id, requestedById: "foreign-user", kind: "CUSTOMER_SUMMARY", entityType: "Company", entityId: foreignCompany.id, provider: "SIMULATED", model: "test", inputDigest: "foreign", sanitizedContext: {}, output: {}, status: "GENERATED" } });

const mainMembership = await prisma.membership.findFirstOrThrow({ where: { organizationId: main.id, status: "ACTIVE" }, include: { user: true } });
const actor: TenantActor = { userId: mainMembership.userId, organizationId: main.id, organizationName: main.name, role: "OWNER" };
const visibleCompanies = await listCompanies(actor);
assert.equal(visibleCompanies.some((company) => company.id === foreignCompany.id), false, "Consulta vazou empresa de outro tenant.");
const visibleCustomers = await listCustomers(actor);
assert.equal(visibleCustomers.some((company) => company.id === foreignCompany.id), false, "Visão de clientes vazou conta de outro tenant.");
const automationWorkspace = await listAutomationWorkspace(actor);
assert.equal(automationWorkspace.automations.some((automation) => automation.id === foreignAutomation.id), false, "Automação de outro tenant ficou visível.");
const integrationWorkspace = await listIntegrationWorkspace(actor);
assert.equal(integrationWorkspace.forms.some((form) => form.organizationId === other.id), false, "Integração de outro tenant ficou visível.");
const aiWorkspace = await listAiWorkspace(actor);
assert.equal(aiWorkspace.requests.some((request) => request.id === foreignAiRequest.id), false, "Rascunho de IA de outro tenant ficou visível.");
const report = await getCrmReport(actor);
assert.equal(report.reconciliation.opportunityIds.length, await prisma.opportunity.count({ where: { organizationId: main.id } }), "Relatório não conciliou com as oportunidades do tenant.");

await assert.rejects(
  createLead(actor, { companyId: foreignCompany.id, title: "Lead indevido", source: "Teste", validationSource: "Teste", score: 1 }),
  /organiza.*ativa/i,
);
await assert.rejects(
  createTicket(actor, { companyId: foreignCompany.id, subject: "Ticket indevido", description: "Tentativa de gravação em outro tenant", priority: "HIGH" }),
  /organiza.*ativa/i,
);

const seedAutomation = await prisma.automation.findFirstOrThrow({ where: { organizationId: main.id, status: "PUBLISHED", triggerType: "CAPTURE_FORM_SUBMITTED" } });
const seedCompany = await prisma.company.findFirstOrThrow({ where: { organizationId: main.id } });
const seedLead = await prisma.lead.findFirstOrThrow({ where: { organizationId: main.id, companyId: seedCompany.id } });
const event = { organizationId: main.id, triggerType: "CAPTURE_FORM_SUBMITTED" as const, eventKey: "integration-idempotency-phase-6-v1", payload: { companyId: seedCompany.id, leadId: seedLead.id, contact: { email: "integration@synthetic.local" } } };
const firstRuns = await dispatchAutomationEvent(event);
const secondRuns = await dispatchAutomationEvent(event);
assert.deepEqual(secondRuns, firstRuns, "O mesmo evento não reutilizou a execução idempotente.");
assert.equal(await prisma.automationRun.count({ where: { organizationId: main.id, automationId: seedAutomation.id, eventKey: event.eventKey } }), 1, "Evento externo criou mais de uma execução.");
const idempotentRun = await prisma.automationRun.findFirstOrThrow({ where: { organizationId: main.id, automationId: seedAutomation.id, eventKey: event.eventKey }, include: { actionLogs: true } });
assert.equal(new Set(idempotentRun.actionLogs.map((log) => log.actionIndex)).size, idempotentRun.actionLogs.length, "Ação foi repetida na retentativa.");

const privacyEmail = "privacy-integration@synthetic.local";
const mainPrivacyCompany = await prisma.company.create({
  data: { organizationId: main.id, name: "Privacy Integration Main", document: "88888888888888", email: privacyEmail, source: "integration", lifecycle: "LEAD" },
});
await prisma.contact.create({ data: { organizationId: main.id, companyId: mainPrivacyCompany.id, name: "Titular Main", email: privacyEmail } });
const foreignPrivacyCompany = await prisma.company.create({
  data: { organizationId: other.id, name: "Privacy Integration Foreign", document: "77777777777777", email: privacyEmail, source: "integration", lifecycle: "LEAD" },
});
const foreignPrivacyContact = await prisma.contact.create({ data: { organizationId: other.id, companyId: foreignPrivacyCompany.id, name: "Titular Foreign", email: privacyEmail } });
const foreignPrivacyRequest = await prisma.privacyRequest.create({
  data: { organizationId: other.id, protocol: "LGPD-FOREIGN-INTEGRATION", type: "CONFIRMATION_ACCESS", status: "IN_PROGRESS", subjectEmail: privacyEmail, dueAt: new Date(Date.now() + 86_400_000), createdById: "foreign-test" },
});
const privacyRequest = await createPrivacyRequest(actor, { type: "PORTABILITY", subjectEmail: privacyEmail, subjectName: "Titular Main", details: "" });
await updatePrivacyRequest(actor, privacyRequest.id, "IDENTITY_VERIFICATION");
await updatePrivacyRequest(actor, privacyRequest.id, "IN_PROGRESS");
await assert.rejects(previewPrivacyRequest(actor, foreignPrivacyRequest.id), /indisponível/i);
const preview = await previewPrivacyRequest(actor, privacyRequest.id);
const executed = await executePrivacyRequest(actor, privacyRequest.id, preview.token);
assert.equal(executed.packageData.data.contacts.some((contact) => contact.id === foreignPrivacyContact.id), false, "Portabilidade vazou contato de outro tenant.");
assert.equal(executed.packageData.data.companies.some((company) => company.id === foreignPrivacyCompany.id), false, "Portabilidade vazou empresa de outro tenant.");
assert.ok(await prisma.contact.findUnique({ where: { id: foreignPrivacyContact.id } }), "Execução de privacidade alterou dados do outro tenant.");
await assert.rejects(executePrivacyRequest(actor, privacyRequest.id, preview.token), /atendimento/i);

await prisma.auditLog.deleteMany({ where: { organizationId: main.id, entityId: privacyRequest.id } });
await prisma.privacyRequest.delete({ where: { id: privacyRequest.id } });
await prisma.company.delete({ where: { id: mainPrivacyCompany.id } });
await prisma.organization.delete({ where: { id: other.id } });
await prisma.$disconnect();
console.log("Integração aprovada: tenants isolados, relatórios conciliados, automação idempotente e privacidade isolada.");
