import { config } from "dotenv";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed sintético não pode ser executado em produção.");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL é obrigatória para executar o seed.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const passwordHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@tupiniquim.local" },
    update: { name: "Admin Tupiniquim", active: true, passwordHash },
    create: { name: "Admin Tupiniquim", email: "admin@tupiniquim.local", active: true, passwordHash },
  });
  const organization = await prisma.organization.upsert({
    where: { slug: "tupiniquim-tech" },
    update: { name: "Tupiniquim Tech", active: true },
    create: { name: "Tupiniquim Tech", slug: "tupiniquim-tech" },
  });
  await prisma.dataRetentionPolicy.upsert({
    where: { organizationId: organization.id },
    update: { commercialDataDays: 1825, captureSubmissionDays: 730, reportExportDays: 1, aiRequestDays: 365, auditLogDays: 1825, incidentLogDays: 1825, updatedById: user.id },
    create: { organizationId: organization.id, commercialDataDays: 1825, captureSubmissionDays: 730, reportExportDays: 1, aiRequestDays: 365, auditLogDays: 1825, incidentLogDays: 1825, updatedById: user.id },
  });
  await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: { organizationId: organization.id, userId: user.id, role: "OWNER", status: "ACTIVE" },
  });
  const pipeline = await prisma.pipeline.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Pipeline principal" } },
    update: { active: true },
    create: { organizationId: organization.id, name: "Pipeline principal" },
  });
  const stageDefinitions = [
    ["Qualificação", 1, 15, "#60a5fa"], ["Diagnóstico", 2, 35, "#a78bfa"],
    ["Proposta", 3, 60, "#f59e0b"], ["Negociação", 4, 80, "#22c55e"],
  ] as const;
  const stages = [];
  for (const [name, position, probability, color] of stageDefinitions) {
    stages.push(await prisma.pipelineStage.upsert({
      where: { pipelineId_position: { pipelineId: pipeline.id, position } },
      update: { name, probability, color },
      create: { pipelineId: pipeline.id, name, position, probability, color },
    }));
  }
  const company = await prisma.company.upsert({
    where: { organizationId_document: { organizationId: organization.id, document: "00000000000100" } },
    update: { name: "Empresa Demonstração", segment: "Tecnologia", source: "Seed sintético", lifecycle: "CUSTOMER" },
    create: {
      organizationId: organization.id, ownerId: user.id, name: "Empresa Demonstração",
      document: "00000000000100", segment: "Tecnologia", source: "Seed sintético", lifecycle: "CUSTOMER",
    },
  });
  const contact = await prisma.contact.findFirst({ where: { organizationId: organization.id, companyId: company.id, email: "contato@empresa.local" } });
  if (!contact) await prisma.contact.create({ data: { organizationId: organization.id, companyId: company.id, name: "Contato Demonstração", email: "contato@empresa.local", decisionMaker: true } });
  const lead = await prisma.lead.findFirst({ where: { organizationId: organization.id, companyId: company.id, title: "Implantação do CRM" } });
  if (!lead) await prisma.lead.create({ data: { organizationId: organization.id, companyId: company.id, assignedToId: user.id, title: "Implantação do CRM", source: "Seed sintético", validationSource: "Cadastro interno", status: "QUALIFIED", score: 85 } });
  const opportunity = await prisma.opportunity.findFirst({ where: { organizationId: organization.id, companyId: company.id, title: "Projeto comercial demonstração" } });
  const savedOpportunity = opportunity ?? await prisma.opportunity.create({ data: { organizationId: organization.id, companyId: company.id, pipelineId: pipeline.id, stageId: stages[2].id, ownerId: user.id, title: "Projeto comercial demonstração", value: 25000, expectedCloseAt: new Date("2026-09-30") } });
  await prisma.product.upsert({
    where: { organizationId_sku: { organizationId: organization.id, sku: "CRM-IMPL" } },
    update: { name: "Implantação CRM", price: 25000, active: true },
    create: { organizationId: organization.id, sku: "CRM-IMPL", name: "Implantação CRM", description: "Implantação e configuração inicial", price: 25000 },
  });
  const activity = await prisma.activity.findFirst({ where: { organizationId: organization.id, opportunityId: savedOpportunity.id, title: "Follow-up da proposta" } });
  if (!activity) await prisma.activity.create({ data: { organizationId: organization.id, companyId: company.id, opportunityId: savedOpportunity.id, assignedToId: user.id, createdById: user.id, type: "FOLLOW_UP", title: "Follow-up da proposta", dueAt: new Date("2026-08-15T13:00:00Z") } });
  const proposal = await prisma.proposal.findUnique({ where: { organizationId_number_version: { organizationId: organization.id, number: 1, version: 1 } } });
  if (!proposal) await prisma.proposal.create({ data: { organizationId: organization.id, companyId: company.id, opportunityId: savedOpportunity.id, number: 1, title: "Proposta de implantação", subtotal: 25000, total: 25000, items: { create: [{ description: "Implantação CRM", quantity: 1, unitPrice: 25000, total: 25000, position: 1 }] } } });
  const revenue = await prisma.revenue.findFirst({ where: { organizationId: organization.id, companyId: company.id, description: "Projeto comercial demonstração" } });
  if (!revenue) await prisma.revenue.create({ data: { organizationId: organization.id, companyId: company.id, opportunityId: savedOpportunity.id, type: "PROJECT", status: "FORECAST", description: "Projeto comercial demonstração", amount: 25000, startsAt: new Date("2026-09-01") } });

  const mrr = await prisma.revenue.findFirst({ where: { organizationId: organization.id, companyId: company.id, description: "Suporte mensal demonstração" } });
  if (!mrr) await prisma.revenue.create({ data: { organizationId: organization.id, companyId: company.id, type: "MRR", status: "ACTIVE", description: "Suporte mensal demonstração", amount: 3200, startsAt: new Date("2026-08-01") } });

  const onboarding = await prisma.onboardingPlan.findFirst({ where: { organizationId: organization.id, companyId: company.id, name: "Onboarding demonstração" } });
  if (!onboarding) await prisma.onboardingPlan.create({
    data: {
      organizationId: organization.id, companyId: company.id, ownerId: user.id, name: "Onboarding demonstração",
      status: "IN_PROGRESS", startedAt: new Date("2026-08-01"), targetCompletionAt: new Date("2026-08-30"),
      steps: { create: [
        { organizationId: organization.id, assignedToId: user.id, title: "Reunião de kick-off", position: 1, status: "COMPLETED", completedAt: new Date("2026-08-02") },
        { organizationId: organization.id, assignedToId: user.id, title: "Coleta de acessos e requisitos", position: 2, status: "COMPLETED", completedAt: new Date("2026-08-04") },
        { organizationId: organization.id, assignedToId: user.id, title: "Configuração e implantação", position: 3, status: "IN_PROGRESS" },
        { organizationId: organization.id, assignedToId: user.id, title: "Treinamento da equipe", position: 4 },
        { organizationId: organization.id, assignedToId: user.id, title: "Go-live e aceite", position: 5 },
      ] },
    },
  });

  const ticket = await prisma.ticket.findFirst({ where: { organizationId: organization.id, companyId: company.id, subject: "Revisar acesso ao painel" } });
  if (!ticket) await prisma.ticket.create({ data: { organizationId: organization.id, companyId: company.id, assignedToId: user.id, createdById: user.id, number: 1, subject: "Revisar acesso ao painel", description: "Solicitação sintética para validar o atendimento.", priority: "MEDIUM", status: "OPEN", slaDueAt: new Date("2026-08-15T18:00:00Z") } });

  const renewal = await prisma.renewal.findFirst({ where: { organizationId: organization.id, companyId: company.id, title: "Renovação anual demonstração" } });
  if (!renewal) await prisma.renewal.create({ data: { organizationId: organization.id, companyId: company.id, ownerId: user.id, title: "Renovação anual demonstração", amount: 38400, renewalAt: new Date("2026-10-31"), probability: 75, status: "IN_NEGOTIATION", notes: "Registro inteiramente sintético." } });

  const upsell = await prisma.upsellOpportunity.findFirst({ where: { organizationId: organization.id, companyId: company.id, title: "Módulo de automação" } });
  if (!upsell) await prisma.upsellOpportunity.create({ data: { organizationId: organization.id, companyId: company.id, ownerId: user.id, title: "Módulo de automação", description: "Oportunidade sintética de expansão.", potentialValue: 12000, expectedCloseAt: new Date("2026-09-30"), status: "QUALIFIED" } });

  const health = await prisma.customerHealthScore.findFirst({ where: { organizationId: organization.id, companyId: company.id, calculationVersion: "seed-v1" } });
  if (!health) await prisma.customerHealthScore.create({ data: { organizationId: organization.id, companyId: company.id, score: 82, band: "HEALTHY", engagementScore: 85, supportScore: 92, onboardingScore: 60, revenueScore: 100, renewalScore: 85, riskFactors: [], calculationVersion: "seed-v1", calculatedAt: new Date("2026-08-11T12:00:00Z") } });

  console.log("Seed concluído: admin@tupiniquim.local / senha sintética definida por SEED_ADMIN_PASSWORD.");
  for (const provider of ["EMAIL", "CALENDAR", "WHATSAPP", "WEBHOOK"] as const) {
    await prisma.integrationConnection.upsert({
      where: { organizationId_provider_name: { organizationId: organization.id, provider, name: `${provider} sandbox` } },
      update: { status: "SANDBOX", active: true, settings: { safeMode: true } },
      create: { organizationId: organization.id, provider, name: `${provider} sandbox`, status: "SANDBOX", settings: { safeMode: true } },
    });
  }
  const template = await prisma.messageTemplate.upsert({
    where: { organizationId_provider_name: { organizationId: organization.id, provider: "EMAIL", name: "Recebimento de contato" } },
    update: { status: "APPROVED", approvedById: user.id, approvedAt: new Date("2026-08-13T12:00:00Z") },
    create: { organizationId: organization.id, provider: "EMAIL", name: "Recebimento de contato", subject: "Recebemos seu contato", body: "Olá {{nome}}, recebemos sua solicitação e retornaremos em breve.", status: "APPROVED", approvedById: user.id, approvedAt: new Date("2026-08-13T12:00:00Z") },
  });
  const captureForm = await prisma.captureForm.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Fale com a Tupiniquim" } },
    update: { active: true },
    create: { organizationId: organization.id, name: "Fale com a Tupiniquim", description: "Conte seu desafio comercial para nossa equipe.", source: "SITE_DEMONSTRACAO", createdById: user.id, fields: [
      { name: "contactName", label: "Seu nome", type: "text", required: true },
      { name: "companyName", label: "Empresa", type: "text", required: true },
      { name: "email", label: "E-mail", type: "email", required: true },
      { name: "phone", label: "Telefone", type: "tel", required: false },
      { name: "interest", label: "Como podemos ajudar?", type: "textarea", required: true },
    ] },
  });
  const existingAutomation = await prisma.automation.findUnique({ where: { organizationId_name: { organizationId: organization.id, name: "Receber contato do site" } } });
  if (!existingAutomation) {
    await prisma.automation.create({
      data: {
        organizationId: organization.id, name: "Receber contato do site", description: "Cria tarefa e prepara uma resposta aprovada, sem envio automático.", status: "PUBLISHED", triggerType: "CAPTURE_FORM_SUBMITTED", currentVersion: 1, createdById: user.id,
        versions: { create: { organizationId: organization.id, version: 1, triggerConfig: { formId: captureForm.id }, conditions: [], actions: [
          { type: "CREATE_TASK", title: "Qualificar contato recebido", dueInHours: 4, assignedToId: user.id },
          { type: "PREPARE_MESSAGE", provider: "EMAIL", templateId: template.id, recipientField: "contact.email" },
        ], createdById: user.id, publishedAt: new Date("2026-08-13T12:00:00Z") } },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
