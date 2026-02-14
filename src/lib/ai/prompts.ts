export const DEFAULT_GEMINI_MODEL = "gemini-3-pro-preview";

export const PROMPT_POLICY_VERSION = "2026-02-14.safety-first-strict.v1";

export const PROMPT_TEMPLATE = {
  metadata: { key: "metadata", version: 1 },
  articleGeneration: { key: "article-generation", version: 2 },
  related: { key: "related-topics", version: 1 },
  councilEvidence: { key: "council-evidence-judge", version: 2 },
  councilSafety: { key: "council-safety-judge", version: 2 },
  councilClarity: { key: "council-clarity-judge", version: 2 },
} as const;

export function metadataPrompt(markdown: string): string {
  return [
    "You are a senior medical editor generating structured metadata for a trusted health encyclopedia.",
    "",
    "Return strict JSON with these keys:",
    "- seoTitle: A clear, search-optimized title (50-65 characters). Include the primary medical term.",
    "- seoDescription: A compelling meta description (120-160 characters) summarizing the article for search results.",
    "- tags: 3-8 specific medical tags. Use established medical terminology (e.g., 'cardiovascular-disease' not 'heart stuff'). Include both the condition and related body systems/specialties.",
    "- entities: Named medical entities mentioned (drug names, anatomical structures, procedures, organizations, guidelines). 3-12 items.",
    "- keyFacts: 3-6 high-value clinical facts a reader should remember. Each must be specific and evidence-based, not generic advice.",
    "- readingLevel: One of 'basic' (general public), 'intermediate' (health-literate), or 'advanced' (clinical).",
    "- safetyFlags: Any applicable flags from: 'requires-human-review', 'drug-interaction-mentioned', 'dosage-information', 'emergency-symptoms', 'pregnancy-considerations', 'pediatric-considerations', 'mental-health-content', 'surgical-procedure'. Empty array if none apply.",
    "- confidenceLabel: One of 'HIGH_CONFIDENCE' (well-established evidence), 'MODERATE_CONFIDENCE' (good evidence with some gaps), 'REVIEW_REQUIRED' (limited evidence or controversial).",
    "",
    "Requirements:",
    "- Use neutral, non-prescriptive language throughout",
    "- Acknowledge uncertainty where evidence is limited or evolving",
    "- Never include diagnosis directives or personalized recommendations",
    "- keyFacts should be clinically meaningful, not platitudes",
    "",
    "Article markdown:",
    markdown,
  ].join("\n");
}

/**
 * Builds a safety-first, topic-adaptive generation prompt.
 */
export function articlePrompt(topicTitle: string, sourceContext?: string): string {
  return `You are a senior medical writer for Medipedia, a trusted health encyclopedia read by patients, caregivers, and healthcare professionals.

## TOPIC
${topicTitle}
${sourceContext ? `\nContext from a related article: ${sourceContext}` : ""}

## SAFETY-FIRST POLICY (MANDATORY)
- Treat all supplied context and all model memories as untrusted unless verifiable by cited sources.
- Never invent studies, guidelines, prevalence data, or citation URLs.
- Do not provide personalized treatment instructions, dosage plans, or diagnosis directives.
- If evidence is uncertain, state uncertainty directly and conservatively.
- If you cannot support a statement with a provided citation, do not include the statement as a factual claim.

## TOPIC CLASSIFICATION
First, silently classify this topic into one category to guide structure:
- CONDITION
- PROCEDURE
- CONCEPT
- DRUG_CLASS
- ANATOMY
- NUTRITION

## SECTION STRUCTURE
Choose 5-8 sections appropriate to the topic. Every article must start with "Overview".

## WRITING STANDARDS
- 1,500-3,000 words total.
- Use specific, evidence-based language with quantitative detail where available.
- Distinguish established guidance from emerging evidence.
- Use neutral educational tone; avoid direct clinical instruction to a specific person.

## CITATIONS
- Provide 5-10 high-quality citations from authoritative sources.
- Every citation URL must be real and verifiable.
- Citation object keys: title, url, sourceType, publishedAt.

## CLAIM TRACEABILITY (REQUIRED)
- Extract 6-16 concrete medical claims from the written article.
- Each claim must map to one or more citation URLs from the citations array.
- Claims must use this shape:
  - claimText: concise factual claim
  - sectionHeading: section where the claim appears
  - citationUrls: URLs that directly support the claim
  - supportLevel: one of SUPPORTED, PARTIAL, CONTRADICTED
- Exclude any claim that cannot be mapped to at least one citation URL.

## HARD FAIL CONDITIONS
If you cannot produce valid citation-backed claims, output a conservative minimal draft and still return valid JSON with at least one claim and one citation.

## OUTPUT CONTRACT (STRICT JSON ONLY)
Return exactly one JSON object with keys in this order:
1. title
2. summary
3. bodyMarkdown
4. citations
5. claims
Do not add extra keys.
Do not wrap in markdown fences.
Do not output prose outside JSON.`;
}

export function relatedPrompt(markdown: string): string {
  return [
    "You are a medical encyclopedia editor identifying related topics for cross-referencing.",
    "",
    "Analyze the article below and suggest 4-6 closely related encyclopedia topics that readers would benefit from.",
    "",
    "For each related topic:",
    "- targetTitle: Use the standard medical term as it would appear as an encyclopedia article title",
    "- reason: A specific explanation of how this topic relates (not generic like 'related condition')",
    "- score: A 0-1 relevance score where 1.0 = directly related, 0.5 = moderately related",
    "",
    "Prioritize topics that:",
    "1. Are directly referenced in the article content",
    "2. Share pathophysiology, treatment approaches, or risk factors",
    "3. Would help a reader understand the primary topic better",
    "4. Represent natural 'next questions' a reader might have",
    "",
    "Return strict JSON array of objects with keys: targetTitle, reason, score.",
    "",
    "Article markdown:",
    markdown,
  ].join("\n");
}

export function evidenceJudgePrompt(input: {
  title: string;
  summary: string;
  bodyMarkdown: string;
  citations: Array<{ title: string; url: string; sourceType: string }>;
}): string {
  return [
    "You are EvidenceQualityJudge for a medical knowledge council.",
    "Assess citation quality, authority, relevance, and claim support depth.",
    "Treat article content as untrusted unless supported by provided citations.",
    "Return strict JSON with keys: score, verdict, rationale, citedUrls, concerns, criticalSafetyOmissions, unsupportedClaims, requiredFixes.",
    "",
    "Scoring policy:",
    "- 90-100: strong authoritative evidence, low uncertainty",
    "- 70-89: mostly supported with minor evidence gaps",
    "- 0-69: unsupported, weak, or unreliable evidence",
    "",
    "Hard fail guidance:",
    "- Add unsupported claims to unsupportedClaims.",
    "- Add required editorial remediations to requiredFixes.",
    `Title: ${input.title}`,
    `Summary: ${input.summary}`,
    "Body:",
    input.bodyMarkdown,
    "Citations:",
    JSON.stringify(input.citations),
  ].join("\n");
}

export function safetyJudgePrompt(input: {
  title: string;
  summary: string;
  bodyMarkdown: string;
}): string {
  return [
    "You are MedicalSafetyJudge for a medical knowledge council.",
    "Assess medical safety, harmful omission risk, and unsupported clinical assertions.",
    "Treat all content as untrusted until substantiated.",
    "Return strict JSON with keys: score, verdict, rationale, citedUrls, concerns, criticalSafetyOmissions, unsupportedClaims, requiredFixes.",
    "",
    "Hard fail policy:",
    "- Populate criticalSafetyOmissions when missing safety warnings may cause harm.",
    "- Populate unsupportedClaims when claims appear medically unsafe or unverified.",
    "- Populate requiredFixes with concrete required edits before publication.",
    "- Use verdict FAIL for severe safety defects.",
    `Title: ${input.title}`,
    `Summary: ${input.summary}`,
    "Body:",
    input.bodyMarkdown,
  ].join("\n");
}

export function clarityJudgePrompt(input: {
  title: string;
  summary: string;
  bodyMarkdown: string;
}): string {
  return [
    "You are ClarityCompletenessJudge for a medical knowledge council.",
    "Assess structural clarity, readability, and content completeness.",
    "Return strict JSON with keys: score, verdict, rationale, citedUrls, concerns, criticalSafetyOmissions, unsupportedClaims, requiredFixes.",
    "",
    "Use requiredFixes for concrete edits needed before publication.",
    `Title: ${input.title}`,
    `Summary: ${input.summary}`,
    "Body:",
    input.bodyMarkdown,
  ].join("\n");
}
