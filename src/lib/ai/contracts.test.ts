import { describe, expect, it } from "vitest";

import { councilJudgeSchema, generatedArticleSchema } from "@/lib/ai/contracts";

describe("ai contracts", () => {
  it("normalizes generated article claims shape", () => {
    const parsed = generatedArticleSchema.parse({
      title: "Hypertension",
      summary: "Short summary",
      bodyMarkdown: "## Overview\ntext",
      citations: [{ url: "https://example.org/source" }],
      claims: [{ claimText: "Claim", sectionHeading: "Overview", citationUrls: "https://example.org/source" }],
    });

    expect(parsed.claims).toHaveLength(1);
    expect(parsed.claims[0].citationUrls).toEqual(["https://example.org/source"]);
    expect(parsed.claims[0].supportLevel).toBe("SUPPORTED");
  });

  it("fills strict safety arrays on council payload", () => {
    const parsed = councilJudgeSchema.parse({
      score: 62,
      verdict: "WARN",
      rationale: "Needs fixes",
    });

    expect(parsed.criticalSafetyOmissions).toEqual([]);
    expect(parsed.unsupportedClaims).toEqual([]);
    expect(parsed.requiredFixes).toEqual([]);
  });
});
