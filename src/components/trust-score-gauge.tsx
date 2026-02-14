"use client";

function scoreColor(score: number) {
  if (score >= 85) return { stroke: "#10b981", text: "text-emerald-500" };
  if (score >= 70) return { stroke: "#f59e0b", text: "text-amber-500" };
  return { stroke: "#f87171", text: "text-red-400" };
}

export function TrustScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const { stroke, text } = scoreColor(score);

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-score-fill"
          style={{ "--score-offset": `${offset}` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${text}`}>{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Trust
        </span>
      </div>
    </div>
  );
}
