export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

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
 * Builds a comprehensive, topic-adaptive prompt for medical article generation.
 * Instead of forcing rigid disease-centric sections, it classifies the topic type
 * and provides appropriate section guidance.
 */
export function articlePrompt(topicTitle: string, sourceContext?: string): string {
  return `You are a senior medical writer for Medipedia, a trusted health encyclopedia read by patients, caregivers, and healthcare professionals. Your task is to write a comprehensive, evidence-based article on the topic below.

## TOPIC
${topicTitle}
${sourceContext ? `\nContext from a related article: ${sourceContext}` : ""}

## TOPIC CLASSIFICATION
First, silently classify this topic into one of these categories to guide your section structure:
- **CONDITION**: A disease, disorder, or syndrome (e.g., "Type 2 Diabetes", "Migraine")
- **PROCEDURE**: A medical test, surgery, or intervention (e.g., "Colonoscopy", "Knee Replacement")
- **CONCEPT**: A health concept, practice, or field (e.g., "Preventive Care", "Herd Immunity", "Palliative Care")
- **DRUG_CLASS**: A medication or drug category (e.g., "SSRIs", "Beta Blockers", "Metformin")
- **ANATOMY**: A body system or structure (e.g., "Cardiovascular System", "Liver")
- **NUTRITION**: Diet, nutrients, or nutritional therapy (e.g., "Mediterranean Diet", "Vitamin D Deficiency")

## SECTION STRUCTURE
Choose sections that make sense for this specific topic. Do NOT use sections that don't apply. Here are guidelines by category:

**For CONDITION topics**, use sections like:
- Overview (required), Epidemiology, Signs and Symptoms, Causes and Risk Factors, Pathophysiology (if relevant), Diagnosis, Treatment and Management, Prognosis, Prevention, Living With [Condition], When to Seek Medical Attention

**For PROCEDURE topics**, use sections like:
- Overview (required), Indications (when it's recommended), Preparation, What to Expect (the procedure itself), Recovery and Aftercare, Risks and Complications, Effectiveness and Outcomes, Alternatives

**For CONCEPT topics**, use sections like:
- Overview (required), Background and Importance, Key Principles, Current Evidence, Clinical Applications, Guidelines and Recommendations, Benefits, Limitations and Controversies, Future Directions

**For DRUG_CLASS topics**, use sections like:
- Overview (required), Mechanism of Action, Indications, Common Medications in This Class, Dosing Considerations, Side Effects, Drug Interactions, Contraindications, Special Populations (elderly, pregnancy, pediatric)

**For ANATOMY topics**, use sections like:
- Overview (required), Structure, Function, Common Conditions, Diagnostic Tests, Maintaining Health

**For NUTRITION topics**, use sections like:
- Overview (required), Nutritional Science, Health Benefits, Dietary Sources, Recommended Intake, Deficiency and Excess, Special Considerations, Current Research

Select 5-8 sections that are most relevant. Every article MUST start with an Overview section.

## WRITING STANDARDS

### Depth and Specificity
- Each section must contain 150-400 words of substantive content
- Include specific statistics, prevalence rates, and quantitative data where available (e.g., "affects approximately 34.2 million Americans" not "affects many people")
- Reference specific clinical guidelines by name (e.g., "The 2023 AHA/ACC guidelines recommend..." not "guidelines suggest...")
- Name specific diagnostic tests, biomarkers, and classification systems
- Include specific drug names, dosages ranges, and treatment durations where relevant
- Mention landmark studies or meta-analyses by name when they shaped current practice

### Evidence Quality
- Prioritize information from: peer-reviewed journals, major medical organizations (WHO, CDC, NIH, AHA, ACS, NICE), Cochrane reviews, and clinical practice guidelines
- Clearly distinguish between well-established facts and emerging evidence
- Use hedging language appropriately: "evidence suggests", "studies indicate", "current guidelines recommend"
- Note when evidence is limited, conflicting, or rapidly evolving
- Include the level of evidence where relevant (e.g., "supported by multiple randomized controlled trials")

### Tone and Voice
- Write at a health-literate public level (aim for an educated non-specialist reader)
- Use medical terminology but always provide plain-language explanations in parentheses
- Be authoritative but not prescriptive — inform, don't advise
- Never say "you should" or give personalized medical advice
- Include a note that readers should consult healthcare providers for personal medical decisions
- Maintain a balanced, objective perspective even on controversial topics

### Formatting
- Use ## for main section headings
- Use ### for subsections within longer sections
- Use bullet points and numbered lists for clarity when listing items
- Use **bold** for key medical terms on first mention
- Keep paragraphs focused — 3-5 sentences each
- The total article should be 1,500-3,000 words

## CITATIONS
- Provide 5-10 high-quality citations
- Strongly prefer authoritative sources:
  - Government health agencies (CDC, NIH, NHS, WHO) → sourceType: "government"
  - Peer-reviewed journals (NEJM, Lancet, JAMA, BMJ) → sourceType: "peer-reviewed"
  - Medical organizations (AHA, ACS, ACOG) → sourceType: "medical-organization"
  - Clinical databases (UpToDate, Cochrane) → sourceType: "clinical-database"
  - Educational institutions → sourceType: "academic"
  - Public health organizations → sourceType: "public-health"
- Each citation must have a real, verifiable URL
- Include publishedAt date if known (ISO 8601 format), null if unknown

## OUTPUT FORMAT
Return strict JSON with these keys:
- "title": The article title (use the standard medical term)
- "summary": A 2-3 sentence summary (40-80 words) that captures the key clinical significance. Must be specific to the topic, not generic.
- "bodyMarkdown": The full article in Markdown format following the section structure above
- "citations": Array of objects with keys: title, url, sourceType, publishedAt

Do NOT include any text outside the JSON object. Do NOT wrap in markdown code fences.`;
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
    "Score this article from 0-100 for citation quality, relevance, and authority.",
    "Return strict JSON: score, verdict(PASS|WARN|FAIL), rationale, citedUrls, concerns.",
    "Use grounded evidence checks and penalize weak domains.",
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
    "Score from 0-100 for medical safety, risk framing, and harmful omission risk.",
    "Return strict JSON: score, verdict(PASS|WARN|FAIL), rationale, citedUrls, concerns.",
    "Treat unsupported clinical claims as severe issues.",
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
    "Score from 0-100 for completeness, readability, and structure quality.",
    "Return strict JSON: score, verdict(PASS|WARN|FAIL), rationale, citedUrls, concerns.",
    `Title: ${input.title}`,
    `Summary: ${input.summary}`,
    "Body:",
    input.bodyMarkdown,
  ].join("\n");
}
