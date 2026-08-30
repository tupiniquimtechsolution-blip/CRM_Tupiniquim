-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'LEGITIMATE_INTEREST', 'CREDIT_PROTECTION', 'EXERCISE_OF_RIGHTS', 'VITAL_INTEREST', 'PUBLIC_POLICY', 'HEALTH_PROTECTION', 'RESEARCH');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'REVOKED', 'DENIED');

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('CONFIRMATION_ACCESS', 'CORRECTION', 'ANONYMIZATION_BLOCKING_DELETION', 'PORTABILITY', 'CONSENT_REVOCATION', 'OPPOSITION', 'AUTOMATED_DECISION_REVIEW');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('RECEIVED', 'IDENTITY_VERIFICATION', 'IN_PROGRESS', 'COMPLETED', 'DENIED');

-- CreateEnum
CREATE TYPE "SecurityIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityIncidentStatus" AS ENUM ('OPEN', 'CONTAINED', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- AlterTable
ALTER TABLE "CaptureSubmission" ADD COLUMN "consentAt" TIMESTAMP(3),
ADD COLUMN "legalBasis" "LegalBasis" NOT NULL DEFAULT 'CONSENT',
ADD COLUMN "noticeVersion" TEXT,
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'Atendimento comercial solicitado',
ADD COLUMN "requesterHash" TEXT;

-- CreateTable
CREATE TABLE "PrivacyConsent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectEmail" TEXT,
    "purpose" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'GRANTED',
    "source" TEXT NOT NULL,
    "noticeVersion" TEXT,
    "evidenceDigest" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrivacyConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "subjectEmail" TEXT NOT NULL,
    "subjectName" TEXT,
    "details" TEXT,
    "resolution" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commercialDataDays" INTEGER NOT NULL DEFAULT 1825,
    "captureSubmissionDays" INTEGER NOT NULL DEFAULT 730,
    "reportExportDays" INTEGER NOT NULL DEFAULT 1,
    "aiRequestDays" INTEGER NOT NULL DEFAULT 365,
    "auditLogDays" INTEGER NOT NULL DEFAULT 1825,
    "incidentLogDays" INTEGER NOT NULL DEFAULT 1825,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" "SecurityIncidentSeverity" NOT NULL,
    "status" "SecurityIncidentStatus" NOT NULL DEFAULT 'OPEN',
    "personalDataInvolved" BOOLEAN NOT NULL DEFAULT false,
    "relevantRisk" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "containedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notificationDueAt" TIMESTAMP(3),
    "anpdNotifiedAt" TIMESTAMP(3),
    "subjectsNotifiedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "PrivacyConsent_organizationId_subjectType_subjectId_idx" ON "PrivacyConsent"("organizationId", "subjectType", "subjectId");
CREATE INDEX "PrivacyConsent_organizationId_subjectEmail_status_idx" ON "PrivacyConsent"("organizationId", "subjectEmail", "status");
CREATE INDEX "PrivacyConsent_organizationId_purpose_status_idx" ON "PrivacyConsent"("organizationId", "purpose", "status");
CREATE UNIQUE INDEX "PrivacyRequest_protocol_key" ON "PrivacyRequest"("protocol");
CREATE INDEX "PrivacyRequest_organizationId_status_dueAt_idx" ON "PrivacyRequest"("organizationId", "status", "dueAt");
CREATE INDEX "PrivacyRequest_organizationId_subjectEmail_requestedAt_idx" ON "PrivacyRequest"("organizationId", "subjectEmail", "requestedAt");
CREATE UNIQUE INDEX "DataRetentionPolicy_organizationId_key" ON "DataRetentionPolicy"("organizationId");
CREATE UNIQUE INDEX "SecurityIncident_protocol_key" ON "SecurityIncident"("protocol");
CREATE INDEX "SecurityIncident_organizationId_status_severity_idx" ON "SecurityIncident"("organizationId", "status", "severity");
CREATE INDEX "SecurityIncident_organizationId_detectedAt_idx" ON "SecurityIncident"("organizationId", "detectedAt");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
CREATE INDEX "Company_organizationId_segment_lifecycle_idx" ON "Company"("organizationId", "segment", "lifecycle");
CREATE INDEX "Lead_organizationId_source_status_idx" ON "Lead"("organizationId", "source", "status");
CREATE INDEX "Opportunity_organizationId_status_ownerId_idx" ON "Opportunity"("organizationId", "status", "ownerId");
CREATE INDEX "Revenue_organizationId_type_status_startsAt_idx" ON "Revenue"("organizationId", "type", "status", "startsAt");
CREATE INDEX "Ticket_organizationId_status_slaDueAt_idx" ON "Ticket"("organizationId", "status", "slaDueAt");

-- AddForeignKey
ALTER TABLE "PrivacyConsent" ADD CONSTRAINT "PrivacyConsent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DataRetentionPolicy" ADD CONSTRAINT "DataRetentionPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SecurityIncident" ADD CONSTRAINT "SecurityIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
