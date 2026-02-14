"use client";

import { BrainCircuit, FlaskConical, ShieldCheck } from "lucide-react";
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
          align="start"
          className="glass-strong w-80 rounded-2xl border-white/10 p-0 text-left shadow-2xl"
        >
          {/* Header */}
          <div className="border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-amber-500">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Lumi</p>
                <p className="text-[11px] text-muted-foreground">
                  AI Research Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-start gap-2.5">
              <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Generates evidence-based articles with grounded citations and
                structured medical content.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Every article is evaluated by a three-judge council before
                publication.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
