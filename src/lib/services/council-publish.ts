export function determinePublishEligibility(input: {
  sourceGatePassed: boolean;
  trustScore: number;
  safetyVerdict: "PASS" | "WARN" | "FAIL";
  criticalSafetyOmissions: string[];
  unsupportedClaims: string[];
  requiredFixes: string[];
}): boolean {
  return (
    input.sourceGatePassed &&
    input.trustScore >= 70 &&
    input.safetyVerdict !== "FAIL" &&
    input.criticalSafetyOmissions.length === 0 &&
    input.unsupportedClaims.length === 0 &&
    input.requiredFixes.length === 0
  );
}
