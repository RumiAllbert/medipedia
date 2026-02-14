import Link from "next/link";
import { ArticleStatus } from "@prisma/client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ArticleCardProps = {
  slug: string;
  title: string;
  summary: string;
  trustScore: number;
  confidenceLabel: string;
  status: ArticleStatus;
  tags?: string[];
};

function trustScoreColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-400";
}

export function ArticleCard({
  slug,
  title,
  summary,
  trustScore,
  confidenceLabel,
  status,
  tags,
}: ArticleCardProps) {
  return (
    <Link href={`/articles/${slug}`} className="group block">
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={status === ArticleStatus.PUBLISHED ? "success" : "warning"}>
              {status}
            </Badge>
            <Badge variant="neutral">{confidenceLabel}</Badge>
          </div>
          <h3 className="text-lg font-semibold leading-tight transition group-hover:text-primary/80">
            {title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${trustScoreColor(trustScore)}`}
              />
              <span className="text-xs text-muted-foreground">
                Trust {trustScore}/100
              </span>
            </div>
            {tags && tags.length > 0 && (
              <div className="flex gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
