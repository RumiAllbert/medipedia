import { ArticleStatus, ReviewDecision, Role, SourceTier } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function seedSourcePolicies() {
  const entries: Array<{ domain: string; tier: SourceTier; enabled: boolean; notes: string }> = [
    { domain: "who.int", tier: SourceTier.A, enabled: true, notes: "Global public health authority" },
    { domain: "cdc.gov", tier: SourceTier.A, enabled: true, notes: "US public health authority" },
    { domain: "nih.gov", tier: SourceTier.A, enabled: true, notes: "US national health authority" },
    {
      domain: "medlineplus.gov",
      tier: SourceTier.A,
      enabled: true,
      notes: "US government patient education",
    },
    { domain: "nejm.org", tier: SourceTier.B, enabled: true, notes: "Peer-reviewed journal" },
    { domain: "example-bad-source.test", tier: SourceTier.C, enabled: false, notes: "Blocked source" },
  ];

  for (const entry of entries) {
    await prisma.sourceDomainPolicy.upsert({
      where: { domain: entry.domain },
      update: {
        tier: entry.tier,
        enabled: entry.enabled,
        notes: entry.notes,
      },
      create: entry,
    });
  }
}

async function main() {
  await seedSourcePolicies();

  await prisma.user.upsert({
    where: { email: "admin@medipedia.local" },
    update: { role: Role.ADMIN, name: "Admin User" },
    create: {
      name: "Admin User",
      email: "admin@medipedia.local",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@medipedia.local" },
    update: { role: Role.REVIEWER, name: "Dr. Alex Rivera" },
    create: {
      name: "Dr. Alex Rivera",
      email: "reviewer@medipedia.local",
      role: Role.REVIEWER,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "contributor@medipedia.local" },
    update: { role: Role.CONTRIBUTOR, name: "Taylor Chen" },
    create: {
      name: "Taylor Chen",
      email: "contributor@medipedia.local",
      role: Role.CONTRIBUTOR,
      emailVerified: new Date(),
    },
  });

  const article = await prisma.article.upsert({
    where: { slug: "hypertension" },
    update: {},
    create: {
      slug: "hypertension",
      title: "Hypertension",
      summary:
        "Hypertension is persistently elevated blood pressure and increases risk of heart, brain, and kidney disease.",
      bodyMarkdown: `## Overview
Hypertension is a chronic condition where blood pressure remains elevated over time.

## Symptoms
Many people have no symptoms. Some may report headaches, vision changes, or dizziness.

## Causes
Risk factors include age, family history, high sodium intake, inactivity, obesity, and kidney disease.

## Diagnosis
Diagnosis is based on repeated blood pressure readings and clinical context.

## Treatment
Treatment includes lifestyle modification and, when needed, antihypertensive medication.

## Prevention
Maintain healthy weight, stay active, reduce sodium, avoid tobacco, and limit alcohol.

## When to seek urgent care
Seek urgent care for chest pain, neurologic symptoms, severe shortness of breath, or very high blood pressure with severe symptoms.
`,
      status: ArticleStatus.PUBLISHED,
      confidenceLabel: "HIGH",
      trustScore: 88,
      evidenceScore: 90,
      freshnessScore: 84,
      consensusScore: 87,
      scoreVersion: 1,
      trustBreakdownJson: {
        formula: "0.35*evidence + 0.25*safety + 0.20*freshness + 0.20*consensus",
        sourceGate: {
          passed: true,
          citationDomains: [
            { domain: "who.int", tier: "A", enabled: true },
            { domain: "cdc.gov", tier: "A", enabled: true },
            { domain: "medlineplus.gov", tier: "A", enabled: true },
          ],
        },
      },
      createdBy: "reviewer@medipedia.local",
      createdById: reviewer.id,
      publishedAt: new Date(),
      lastReviewedAt: new Date(),
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: {
        create: {
          seoTitle: "Hypertension: Symptoms, Causes, Treatment | Medipedia",
          seoDescription:
            "Understand hypertension including diagnosis, treatment, prevention, and when urgent care is needed.",
          keyFacts: [
            "Hypertension is often asymptomatic.",
            "Untreated hypertension raises risk of stroke and heart disease.",
            "Lifestyle changes are core treatment.",
          ],
          tags: ["cardiovascular", "blood pressure", "chronic disease"],
          entities: ["hypertension", "blood pressure", "stroke", "heart disease"],
          readingLevel: "intermediate",
          safetyFlags: ["human-reviewed"],
          generatedByModel: "editorial",
        },
      },
      citations: {
        create: [
          {
            title: "WHO - Hypertension",
            url: "https://www.who.int/news-room/fact-sheets/detail/hypertension",
            sourceType: "public-health",
          },
          {
            title: "CDC - High Blood Pressure",
            url: "https://www.cdc.gov/high-blood-pressure/about/index.html",
            sourceType: "government",
          },
          {
            title: "MedlinePlus - High Blood Pressure",
            url: "https://medlineplus.gov/highbloodpressure.html",
            sourceType: "government",
          },
        ],
      },
      revisions: {
        create: {
          version: 1,
          contentMarkdown:
            "Published baseline revision for hypertension with evidence-focused framing.",
          status: ArticleStatus.PUBLISHED,
          createdBy: "reviewer@medipedia.local",
          notes: "Seed article",
        },
      },
      outgoingRelated: {
        create: [
          {
            targetSlug: "heart-failure",
            targetTitle: "Heart Failure",
            score: 0.82,
            reason: "Common cardiovascular risk and disease overlap.",
          },
          {
            targetSlug: "chronic-kidney-disease",
            targetTitle: "Chronic Kidney Disease",
            score: 0.77,
            reason: "Shared risk profile and clinical complications.",
          },
          {
            targetSlug: "dash-diet",
            targetTitle: "DASH Diet",
            score: 0.71,
            reason: "Evidence-based prevention and management strategy.",
          },
        ],
      },
    },
  });

  await prisma.review.upsert({
    where: {
      id: `${article.id}-seed-review`,
    },
    update: {},
    create: {
      id: `${article.id}-seed-review`,
      articleId: article.id,
      reviewerId: reviewer.id,
      decision: ReviewDecision.APPROVED,
      notes: "Seed approval for demo content.",
    },
  });

  await prisma.councilRun.create({
    data: {
      articleId: article.id,
      status: "SUCCEEDED",
      aggregateScore: 88,
      breakdownJson: {
        evidenceScore: 90,
        freshnessScore: 84,
        consensusScore: 87,
      },
      publishEligible: true,
      promptVersion: "e2+s2+c2",
      policyVersion: "2026-02-14.safety-first-strict.v1",
      judgeResults: {
        create: [
          {
            judgeName: "EvidenceQualityJudge",
            score: 90,
            verdict: "PASS",
            rationale: "Strong authoritative sources.",
            citationsJson: ["https://www.who.int", "https://www.cdc.gov"],
            groundingJson: {},
            latencyMs: 280,
          },
          {
            judgeName: "MedicalSafetyJudge",
            score: 86,
            verdict: "PASS",
            rationale: "Appropriate caution language and escalation guidance.",
            citationsJson: ["https://medlineplus.gov"],
            groundingJson: {},
            latencyMs: 260,
          },
          {
            judgeName: "ClarityCompletenessJudge",
            score: 88,
            verdict: "PASS",
            rationale: "Clear sectioning and patient-friendly structure.",
            citationsJson: ["https://www.who.int"],
            groundingJson: {},
            latencyMs: 230,
          },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
