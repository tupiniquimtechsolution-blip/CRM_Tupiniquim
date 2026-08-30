-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('LEAD_CREATED', 'OPPORTUNITY_STAGE_CHANGED', 'ACTIVITY_COMPLETED', 'FOLLOW_UP_DUE', 'PROPOSAL_ACCEPTED', 'CUSTOMER_INACTIVE', 'RENEWAL_DUE', 'WEBHOOK_RECEIVED', 'CAPTURE_FORM_SUBMITTED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AutomationActionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'AWAITING_APPROVAL');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('EMAIL', 'CALENDAR', 'WHATSAPP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISCONNECTED', 'SANDBOX', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "CaptureSubmissionStatus" AS ENUM ('RECEIVED', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('READY', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiAssistKind" AS ENUM ('CUSTOMER_SUMMARY', 'LEAD_CLASSIFICATION', 'MESSAGE_DRAFT');

-- CreateEnum
CREATE TYPE "AiAssistStatus" AS ENUM ('PROCESSING', 'GENERATED', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AutomationStatus" NOT NULL DEFAULT 'DRAFT',
    "triggerType" "AutomationTriggerType" NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "triggerConfig" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'QUEUED',
    "triggerPayload" JSONB NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationActionLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "actionIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "AutomationActionStatus" NOT NULL DEFAULT 'PENDING',
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'webhook.received',
    "secretHash" TEXT NOT NULL,
    "secretHint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureForm" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'FORMULARIO_PUBLICO',
    "fields" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptureForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "CaptureSubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
    "leadId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "CaptureSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'SANDBOX',
    "settings" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundApproval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT,
    "provider" "IntegrationProvider" NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'text/csv; charset=utf-8',
    "content" TEXT NOT NULL,
    "status" "ReportExportStatus" NOT NULL DEFAULT 'READY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAssistRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "kind" "AiAssistKind" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputDigest" TEXT NOT NULL,
    "sanitizedContext" JSONB NOT NULL,
    "output" JSONB,
    "status" "AiAssistStatus" NOT NULL DEFAULT 'GENERATED',
    "error" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAssistRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Automation_organizationId_status_triggerType_idx" ON "Automation"("organizationId", "status", "triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "Automation_organizationId_name_key" ON "Automation"("organizationId", "name");

-- CreateIndex
CREATE INDEX "AutomationVersion_organizationId_automationId_version_idx" ON "AutomationVersion"("organizationId", "automationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationVersion_automationId_version_key" ON "AutomationVersion"("automationId", "version");

-- CreateIndex
CREATE INDEX "AutomationRun_organizationId_status_nextAttemptAt_idx" ON "AutomationRun"("organizationId", "status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "AutomationRun_organizationId_createdAt_idx" ON "AutomationRun"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRun_organizationId_automationId_eventKey_key" ON "AutomationRun"("organizationId", "automationId", "eventKey");

-- CreateIndex
CREATE INDEX "AutomationActionLog_organizationId_status_idx" ON "AutomationActionLog"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationActionLog_runId_actionIndex_key" ON "AutomationActionLog"("runId", "actionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationActionLog_organizationId_idempotencyKey_key" ON "AutomationActionLog"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_publicId_key" ON "WebhookEndpoint"("publicId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_organizationId_active_idx" ON "WebhookEndpoint"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEndpoint_organizationId_name_key" ON "WebhookEndpoint"("organizationId", "name");

-- CreateIndex
CREATE INDEX "WebhookDelivery_organizationId_status_receivedAt_idx" ON "WebhookDelivery"("organizationId", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_endpointId_eventKey_key" ON "WebhookDelivery"("endpointId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureForm_publicId_key" ON "CaptureForm"("publicId");

-- CreateIndex
CREATE INDEX "CaptureForm_organizationId_active_idx" ON "CaptureForm"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureForm_organizationId_name_key" ON "CaptureForm"("organizationId", "name");

-- CreateIndex
CREATE INDEX "CaptureSubmission_organizationId_status_receivedAt_idx" ON "CaptureSubmission"("organizationId", "status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureSubmission_formId_eventKey_key" ON "CaptureSubmission"("formId", "eventKey");

-- CreateIndex
CREATE INDEX "IntegrationConnection_organizationId_provider_status_idx" ON "IntegrationConnection"("organizationId", "provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_name_key" ON "IntegrationConnection"("organizationId", "provider", "name");

-- CreateIndex
CREATE INDEX "MessageTemplate_organizationId_status_idx" ON "MessageTemplate"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_organizationId_provider_name_key" ON "MessageTemplate"("organizationId", "provider", "name");

-- CreateIndex
CREATE INDEX "OutboundApproval_organizationId_status_createdAt_idx" ON "OutboundApproval"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundApproval_organizationId_idempotencyKey_key" ON "OutboundApproval"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ReportExport_organizationId_userId_status_createdAt_idx" ON "ReportExport"("organizationId", "userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAssistRequest_organizationId_kind_status_createdAt_idx" ON "AiAssistRequest"("organizationId", "kind", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiAssistRequest_organizationId_entityType_entityId_idx" ON "AiAssistRequest"("organizationId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationVersion" ADD CONSTRAINT "AutomationVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationVersion" ADD CONSTRAINT "AutomationVersion_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AutomationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationActionLog" ADD CONSTRAINT "AutomationActionLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationActionLog" ADD CONSTRAINT "AutomationActionLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureForm" ADD CONSTRAINT "CaptureForm_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureSubmission" ADD CONSTRAINT "CaptureSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureSubmission" ADD CONSTRAINT "CaptureSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CaptureForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApproval" ADD CONSTRAINT "OutboundApproval_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundApproval" ADD CONSTRAINT "OutboundApproval_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAssistRequest" ADD CONSTRAINT "AiAssistRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
