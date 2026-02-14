import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScoreGauge } from "./trust-score-gauge";

type ScoreBarProps = {
  label: string;
  score: number;
  weight: string;
};

function ScoreBar({ label, score, weight }: ScoreBarProps) {
  const color =
    score >= 85
      ? "bg-emerald-500"
      : score >= 70
        ? "bg-amber-500"
        : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {label}{" "}
          <span className="text-xs">({weight})</span>
        </span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

type TrustScorecardProps = {
  trustScore: number;
  evidenceScore: number;
  freshnessScore: number;
  consensusScore: number;
  confidenceLabel: string;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
  freshnessBadges?: Array<{ label: string; days: number | null }>;
  evidenceTierSummary?: {
    tierA: number;
    tierB: number;
    tierC: number;
    unknown: number;
  };
};

export function TrustScorecard({
  trustScore,
  evidenceScore,
  freshnessScore,
  consensusScore,
  confidenceLabel,
  lastReviewedAt,
  nextReviewAt,
  freshnessBadges,
  evidenceTierSummary,
}: TrustScorecardProps) {
  const badges = freshnessBadges ?? [];

  function freshnessVariant(days: number | null): "success" | "warning" | "destructive" | "neutral" {
    if (days == null) return "neutral";
    if (days <= 180) return "success";
    if (days <= 365) return "warning";
    return "destructive";
  }

  return (
    <Card className="glass-strong rounded-2xl">
      <CardHeader className="pb-3">
        <TrustScoreGauge score={trustScore} />
        <Badge variant="neutral" className="mx-auto mt-3 w-fit">
          {confidenceLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScoreBar label="Evidence" score={evidenceScore} weight="35%" />
        <ScoreBar label="Freshness" score={freshnessScore} weight="20%" />
        <ScoreBar label="Consensus" score={consensusScore} weight="20%" />
        <p className="text-xs text-muted-foreground">
          Formula: 0.35 evidence + 0.25 safety + 0.20 freshness + 0.20 consensus
        </p>
        {lastReviewedAt && (
          <p className="text-xs text-muted-foreground">
            Last reviewed: {new Date(lastReviewedAt).toLocaleDateString()}
          </p>
        )}
        {nextReviewAt && (
          <p className="text-xs text-muted-foreground">
            Next review: {new Date(nextReviewAt).toLocaleDateString()}
          </p>
        )}
        {evidenceTierSummary && (
          <div className="rounded-xl border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Evidence tiers</p>
            <p className="mt-1">
              A: {evidenceTierSummary.tierA} · B: {evidenceTierSummary.tierB} · C: {evidenceTierSummary.tierC}
              {evidenceTierSummary.unknown > 0 ? ` · Unknown: ${evidenceTierSummary.unknown}` : ""}
            </p>
          </div>
        )}
        {badges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Citation freshness</p>
            <div className="flex flex-wrap gap-1.5">
              {badges.slice(0, 8).map((badge) => (
                <Badge key={`${badge.label}-${badge.days ?? "na"}`} variant={freshnessVariant(badge.days)}>
                  {badge.label}: {badge.days == null ? "unknown" : `${badge.days}d`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
