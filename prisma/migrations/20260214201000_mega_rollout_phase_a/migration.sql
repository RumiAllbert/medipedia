-- Phase A: additive-only schema for trust/prompt transparency rollout.

-- CreateEnum
CREATE TYPE "ContentReportType" AS ENUM ('ACCURACY', 'SAFETY', 'OUTDATED', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('OPEN', 'TRIAGED', 'RESOLVED', 'DISMISSED');

-- Add additive indexes for query speed
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt" DESC);
CREATE INDEX "Article_nextReviewAt_idx" ON "Article"("nextReviewAt");

-- AlterTable
ALTER TABLE "Citation" ADD COLUMN "freshnessDays" INTEGER;

-- AlterTable
ALTER TABLE "GenerationJob" ADD COLUMN "promptVersion" TEXT;
CREATE INDEX "GenerationJob_status_updatedAt_idx" ON "GenerationJob"("status", "updatedAt");

-- AlterTable
ALTER TABLE "CouncilRun"
ADD COLUMN "promptVersion" TEXT,
ADD COLUMN "policyVersion" TEXT;

-- AlterTable
CREATE INDEX "AgentJob_status_runAt_updatedAt_idx" ON "AgentJob"("status", "runAt", "updatedAt");

-- AlterTable
CREATE INDEX "ReviewAlert_status_createdAt_idx" ON "ReviewAlert"("status", "createdAt");

-- CreateTable
CREATE TABLE "PromptTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "body" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromptTemplate_key_version_key" ON "PromptTemplate"("key", "version");
CREATE INDEX "PromptTemplate_key_active_idx" ON "PromptTemplate"("key", "active");

-- CreateTable
CREATE TABLE "PromptRun" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "templateKey" TEXT NOT NULL,
  "templateVersion" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "rawResponseRef" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "latencyMs" INTEGER,
  "articleId" TEXT,
  "generationJobId" TEXT,
  "councilRunId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromptRun_articleId_createdAt_idx" ON "PromptRun"("articleId", "createdAt");
CREATE INDEX "PromptRun_generationJobId_createdAt_idx" ON "PromptRun"("generationJobId", "createdAt");
CREATE INDEX "PromptRun_councilRunId_createdAt_idx" ON "PromptRun"("councilRunId", "createdAt");

-- CreateTable
CREATE TABLE "ArticleClaim" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "sectionHeading" TEXT NOT NULL,
  "claimText" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArticleClaim_articleId_orderIndex_idx" ON "ArticleClaim"("articleId", "orderIndex");

-- CreateTable
CREATE TABLE "ClaimCitation" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "citationId" TEXT NOT NULL,
  "supportType" TEXT NOT NULL DEFAULT 'supports',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClaimCitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClaimCitation_claimId_citationId_key" ON "ClaimCitation"("claimId", "citationId");
CREATE INDEX "ClaimCitation_claimId_citationId_idx" ON "ClaimCitation"("claimId", "citationId");

-- CreateTable
CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "reporterId" TEXT,
  "type" "ContentReportType" NOT NULL,
  "details" TEXT NOT NULL,
  "status" "ContentReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
CREATE INDEX "ContentReport_articleId_status_idx" ON "ContentReport"("articleId", "status");

-- AddForeignKey
ALTER TABLE "PromptRun"
ADD CONSTRAINT "PromptRun_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromptRun"
ADD CONSTRAINT "PromptRun_generationJobId_fkey"
FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PromptRun"
ADD CONSTRAINT "PromptRun_councilRunId_fkey"
FOREIGN KEY ("councilRunId") REFERENCES "CouncilRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ArticleClaim"
ADD CONSTRAINT "ArticleClaim_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClaimCitation"
ADD CONSTRAINT "ClaimCitation_claimId_fkey"
FOREIGN KEY ("claimId") REFERENCES "ArticleClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClaimCitation"
ADD CONSTRAINT "ClaimCitation_citationId_fkey"
FOREIGN KEY ("citationId") REFERENCES "Citation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentReport"
ADD CONSTRAINT "ContentReport_articleId_fkey"
FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentReport"
ADD CONSTRAINT "ContentReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
