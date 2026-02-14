"use client";

export function OrbisLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t bg-card/50 px-4 py-2.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        />
        Tag
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#10b981" }}
        />
        High trust (85+)
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
        />
        Moderate (70–84)
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#f87171" }}
        />
        Low (&lt;70)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-px w-4 bg-muted-foreground" />
        Tag link
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-px w-4 border-b border-dashed border-muted-foreground" />
        Related
      </span>
    </div>
  );
}
