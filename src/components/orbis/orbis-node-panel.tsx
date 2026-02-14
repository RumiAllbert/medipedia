"use client";

import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { OrbisGraphData, OrbisNode } from "@/types/orbis";

type OrbisNodePanelProps = {
  nodeId: string;
  data: OrbisGraphData;
  onClose: () => void;
  onNavigateToNode: (id: string) => void;
};

function trustColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-400";
}

function confidenceVariant(label: string) {
  if (label === "HIGH") return "default" as const;
  if (label === "MODERATE") return "secondary" as const;
  return "outline" as const;
}

export function OrbisNodePanel({
  nodeId,
  data,
  onClose,
  onNavigateToNode,
}: OrbisNodePanelProps) {
  const node = data.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const connectedEdges = data.edges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );

  const connectedNodes = connectedEdges
    .map((e) => {
      const otherId = e.source === nodeId ? e.target : e.source;
      return data.nodes.find((n) => n.id === otherId);
    })
    .filter(Boolean) as OrbisNode[];

  if (node.type === "tag") {
    const articles = connectedNodes
      .filter((n) => n.type === "article")
      .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0));

    return (
      <Panel title={node.label} subtitle={`${articles.length} articles`} onClose={onClose}>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-4">
            {articles.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigateToNode(a.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${trustColor(a.trustScore ?? 0)}`}
                />
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                <span className="text-xs text-muted-foreground">
                  {a.trustScore ?? 0}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Panel>
    );
  }

  // Article node
  const tags = connectedNodes.filter((n) => n.type === "tag");
  const related = connectedNodes.filter((n) => n.type === "article");

  return (
    <Panel
      title={node.label}
      subtitle={node.slug ? `/articles/${node.slug}` : undefined}
      onClose={onClose}
    >
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Trust score */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Trust Score
            </p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${trustColor(node.trustScore ?? 0)}`}
                  style={{ width: `${node.trustScore ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {node.trustScore ?? 0}
              </span>
            </div>
          </div>

          {/* Confidence */}
          {node.confidenceLabel && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Confidence
              </p>
              <Badge variant={confidenceVariant(node.confidenceLabel)}>
                {node.confidenceLabel}
              </Badge>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Badge
                    key={t.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => onNavigateToNode(t.id)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related articles */}
          {related.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Related Articles
                </p>
                <div className="space-y-1">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onNavigateToNode(r.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${trustColor(r.trustScore ?? 0)}`}
                      />
                      <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* View article button */}
          {node.slug && (
            <>
              <Separator />
              <Button asChild size="sm" className="w-full gap-2">
                <Link href={`/articles/${node.slug}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  View article
                </Link>
              </Button>
            </>
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-72 flex-col border-l bg-card">
      <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {children}
    </div>
  );
}
