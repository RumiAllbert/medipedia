"use client";

import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LumiTooltip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-teal-400/40 decoration-dotted underline-offset-4 transition-colors hover:decoration-teal-400">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="glass-strong max-w-xs rounded-xl border-white/10 p-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-amber-500/20">
              <Sparkles className="h-4 w-4 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Lumi</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Medipedia&apos;s AI assistant. Generates evidence-based articles
                with grounded citations, then submits them to a three-judge
                council for trust scoring.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
