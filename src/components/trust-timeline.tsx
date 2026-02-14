import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/services/article-timeline";

function severityClasses(severity: TimelineEvent["severity"]): string {
  if (severity === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  if (severity === "destructive") return "border-red-200 bg-red-50 text-red-900";
  return "border-border bg-muted/40 text-foreground";
}

export function TrustTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Trust Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 20).map((event) => (
            <div key={`${event.type}-${event.id}`} className={cn("rounded-xl border px-3 py-2.5", severityClasses(event.severity))}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs opacity-80">{event.details}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {event.type.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] opacity-70">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}

          {events.length === 0 && (
            <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              No trust events yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
