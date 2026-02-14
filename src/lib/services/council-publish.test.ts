import { describe, expect, it } from "vitest";

import { determinePublishEligibility } from "@/lib/services/council-publish";

describe("council publish eligibility", () => {
  it("blocks publication when required fixes exist", () => {
    const eligible = determinePublishEligibility({
      sourceGatePassed: true,
      trustScore: 88,
      safetyVerdict: "PASS",
      criticalSafetyOmissions: [],
      unsupportedClaims: [],
      requiredFixes: ["Add contraindications section"],
    });

    expect(eligible).toBe(false);
  });

  it("allows publication only when all hard-fail arrays are empty", () => {
    const eligible = determinePublishEligibility({
      sourceGatePassed: true,
      trustScore: 75,
      safetyVerdict: "WARN",
      criticalSafetyOmissions: [],
      unsupportedClaims: [],
      requiredFixes: [],
    });

    expect(eligible).toBe(true);
  });
});
