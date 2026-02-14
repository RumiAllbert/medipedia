export type ReviewRiskBreakdown = {
  trustDropMagnitude: number;
  lowFreshnessPenalty: number;
  openAlertsPenalty: number;
  pendingAgePenalty: number;
};

export function calculateReviewRiskScore(input: {
  trustDropMagnitude: number;
  freshnessScore: number;
  openAlertCount: number;
  pendingAgeHours: number;
}): ReviewRiskBreakdown & { riskScore: number } {
  const trustDropMagnitude = Math.max(0, input.trustDropMagnitude);
  const lowFreshnessPenalty = Math.max(0, 70 - input.freshnessScore);
  const openAlertsPenalty = input.openAlertCount * 12;
  const pendingAgePenalty = Math.min(35, Math.round(input.pendingAgeHours * 0.75));

  const riskScore = Math.round(
    trustDropMagnitude * 1.2 + lowFreshnessPenalty * 0.9 + openAlertsPenalty + pendingAgePenalty,
  );

  return {
    riskScore,
    trustDropMagnitude,
    lowFreshnessPenalty,
    openAlertsPenalty,
    pendingAgePenalty,
  };
}
