function isEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export const featureFlags = {
  promptTraceability: isEnabled(process.env.FF_PROMPT_TRACEABILITY),
  trustTimeline: isEnabled(process.env.FF_TRUST_TIMELINE),
  reviewRiskQueue: isEnabled(process.env.FF_REVIEW_RISK_QUEUE),
  adminJobsConsole: isEnabled(process.env.FF_ADMIN_JOBS_CONSOLE),
  articleReporting: isEnabled(process.env.FF_ARTICLE_REPORTING),
};
