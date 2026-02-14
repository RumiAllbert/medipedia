import { z } from "zod";

// Coerce null/string → array for fields Gemini returns inconsistently
const coerceStringArray = z.preprocess(
  (val) => (val == null ? [] : typeof val === "string" ? [val] : val),
  z.array(z.string()),
);

export const metadataSchema = z.object({
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  tags: coerceStringArray.optional().default([]),
  entities: coerceStringArray.optional().default([]),
  keyFacts: coerceStringArray.optional().default([]),
  readingLevel: z.string().optional().default("intermediate"),
  safetyFlags: coerceStringArray.optional().default([]),
  confidenceLabel: z.string().optional().default("REVIEW_REQUIRED"),
});

export type MetadataPayload = z.infer<typeof metadataSchema>;

export const citationSchema = z.object({
  title: z.string().optional().default(""),
  url: z.string(),
  sourceType: z.string().optional().default("unknown"),
  publishedAt: z.string().nullable().optional(),
});

export type CitationPayload = z.infer<typeof citationSchema>;

const supportLevelSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(["SUPPORTED", "PARTIAL", "CONTRADICTED"]).catch("SUPPORTED"),
);

export const generatedClaimSchema = z.object({
  claimText: z.string().optional().default(""),
  sectionHeading: z.string().optional().default("Overview"),
  citationUrls: coerceStringArray.optional().default([]),
  supportLevel: supportLevelSchema.optional().default("SUPPORTED"),
});

export type GeneratedClaimPayload = z.infer<typeof generatedClaimSchema>;

export const generatedArticleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bodyMarkdown: z.string(),
  citations: z.array(citationSchema).optional().default([]),
  claims: z.array(generatedClaimSchema).optional().default([]),
});

export type GeneratedArticlePayload = z.infer<typeof generatedArticleSchema>;

export const relatedCandidateSchema = z.object({
  targetTitle: z.string(),
  reason: z.string().optional().default("Related topic"),
  score: z.number().min(0).max(1).optional().default(0.5),
});

export const relatedCandidatesSchema = z.array(relatedCandidateSchema);

export type RelatedCandidate = z.infer<typeof relatedCandidateSchema>;

export const councilJudgeSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["PASS", "WARN", "FAIL"]),
  rationale: z.string().optional().default("No rationale provided."),
  citedUrls: coerceStringArray.optional().default([]),
  concerns: coerceStringArray.optional().default([]),
  criticalSafetyOmissions: coerceStringArray.optional().default([]),
  unsupportedClaims: coerceStringArray.optional().default([]),
  requiredFixes: coerceStringArray.optional().default([]),
});

export type CouncilJudgePayload = z.infer<typeof councilJudgeSchema>;
