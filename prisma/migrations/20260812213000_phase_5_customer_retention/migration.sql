-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CustomerHealthBand" AS ENUM ('HEALTHY', 'ATTENTION', 'AT_RISK', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('UPCOMING', 'IN_NEGOTIATION', 'RENEWED', 'CHURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UpsellStatus" AS ENUM ('IDENTIFIED', 'QUALIFIED', 'PROPOSED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "OnboardingPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "targetCompletionAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "status" "OnboardingStepStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "channel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "slaDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerHealthScore" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "band" "CustomerHealthBand" NOT NULL,
    "engagementScore" INTEGER NOT NULL,
    "supportScore" INTEGER NOT NULL,
    "onboardingScore" INTEGER NOT NULL,
    "revenueScore" INTEGER NOT NULL,
    "renewalScore" INTEGER NOT NULL,
    "riskFactors" JSONB NOT NULL,
    "calculationVersion" TEXT NOT NULL DEFAULT 'v1',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'UPCOMING',
    "amount" DECIMAL(14,2) NOT NULL,
    "renewalAt" TIMESTAMP(3) NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 50,
    "churnReason" TEXT,
    "churnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Renewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellOpportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT,
    "revenueId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "UpsellStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "potentialValue" DECIMAL(14,2) NOT NULL,
    "expectedCloseAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'CUSTOMER_SUCCESS',
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingPlan_organizationId_status_targetCompletionAt_idx" ON "OnboardingPlan"("organizationId", "status", "targetCompletionAt");

-- CreateIndex
CREATE INDEX "OnboardingPlan_organizationId_companyId_createdAt_idx" ON "OnboardingPlan"("organizationId", "companyId", "createdAt");

-- CreateIndex
CREATE INDEX "OnboardingStep_organizationId_status_dueAt_idx" ON "OnboardingStep"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_planId_position_key" ON "OnboardingStep"("planId", "position");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_status_priority_idx" ON "Ticket"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_companyId_createdAt_idx" ON "Ticket"("organizationId", "companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_organizationId_assignedToId_slaDueAt_idx" ON "Ticket"("organizationId", "assignedToId", "slaDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_organizationId_number_key" ON "Ticket"("organizationId", "number");

-- CreateIndex
CREATE INDEX "CustomerHealthScore_organizationId_band_calculatedAt_idx" ON "CustomerHealthScore"("organizationId", "band", "calculatedAt");

-- CreateIndex
CREATE INDEX "CustomerHealthScore_organizationId_companyId_calculatedAt_idx" ON "CustomerHealthScore"("organizationId", "companyId", "calculatedAt");

-- CreateIndex
CREATE INDEX "Renewal_organizationId_status_renewalAt_idx" ON "Renewal"("organizationId", "status", "renewalAt");

-- CreateIndex
CREATE INDEX "Renewal_organizationId_companyId_renewalAt_idx" ON "Renewal"("organizationId", "companyId", "renewalAt");

-- CreateIndex
CREATE UNIQUE INDEX "UpsellOpportunity_revenueId_key" ON "UpsellOpportunity"("revenueId");

-- CreateIndex
CREATE INDEX "UpsellOpportunity_organizationId_status_expectedCloseAt_idx" ON "UpsellOpportunity"("organizationId", "status", "expectedCloseAt");

-- CreateIndex
CREATE INDEX "UpsellOpportunity_organizationId_companyId_createdAt_idx" ON "UpsellOpportunity"("organizationId", "companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingPlan" ADD CONSTRAINT "OnboardingPlan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingPlan" ADD CONSTRAINT "OnboardingPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingPlan" ADD CONSTRAINT "OnboardingPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "OnboardingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerHealthScore" ADD CONSTRAINT "CustomerHealthScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerHealthScore" ADD CONSTRAINT "CustomerHealthScore_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellOpportunity" ADD CONSTRAINT "UpsellOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellOpportunity" ADD CONSTRAINT "UpsellOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellOpportunity" ADD CONSTRAINT "UpsellOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellOpportunity" ADD CONSTRAINT "UpsellOpportunity_revenueId_fkey" FOREIGN KEY ("revenueId") REFERENCES "Revenue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
