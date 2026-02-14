import { z } from "zod";

export const metadataSchema = z.object({
  seoTitle: z.string().min(5),
  seoDescription: z.string().min(20),
  tags: z.array(z.string().min(2)).min(1).max(12),
  entities: z.array(z.string().min(2)).min(1).max(24),
  keyFacts: z.array(z.string().min(5)).min(1).max(6),
  readingLevel: z.string().min(2),
  safetyFlags: z.array(z.string()).max(10),
  confidenceLabel: z.string().min(2),
});

export type MetadataPayload = z.infer<typeof metadataSchema>;

export const citationSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  sourceType: z.string().min(2),
  publishedAt: z.string().datetime().nullable().optional(),
});

export type CitationPayload = z.infer<typeof citationSchema>;

export const generatedArticleSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(40),
  bodyMarkdown: z.string().min(800),
  citations: z.array(citationSchema).min(3).max(15),
});

export type GeneratedArticlePayload = z.infer<typeof generatedArticleSchema>;

export const relatedCandidateSchema = z.object({
  targetTitle: z.string().min(3),
  reason: z.string().min(5),
  score: z.number().min(0).max(1),
});

export const relatedCandidatesSchema = z.array(relatedCandidateSchema).min(1).max(6);

export type RelatedCandidate = z.infer<typeof relatedCandidateSchema>;

export const councilJudgeSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["PASS", "WARN", "FAIL"]),
  rationale: z.string().min(20).max(1000),
  citedUrls: z.array(z.string().url()).max(12),
  concerns: z.array(z.string().min(3)).max(12),
});

export type CouncilJudgePayload = z.infer<typeof councilJudgeSchema>;
