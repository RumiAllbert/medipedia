import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          className={`h-full rounded-full transition-all ${color}`}
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
};

export function TrustScorecard({
  trustScore,
  evidenceScore,
  freshnessScore,
  consensusScore,
  confidenceLabel,
  lastReviewedAt,
  nextReviewAt,
}: TrustScorecardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Trust Score</CardTitle>
          <Badge
            variant={
              trustScore >= 85
                ? "success"
                : trustScore >= 70
                  ? "warning"
                  : "destructive"
            }
          >
            {trustScore}/100
          </Badge>
        </div>
        <Badge variant="neutral" className="mt-1 w-fit">
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
      </CardContent>
    </Card>
  );
}
