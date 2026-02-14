"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LumiTooltip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help border-b-2 border-teal-500/25 transition-colors duration-200 hover:border-teal-500/50">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          sideOffset={10}
          className="max-w-[280px] rounded-lg border border-border/60 bg-popover px-4 py-3 shadow-xl"
        >
          <p className="text-sm font-semibold text-foreground">
            Lumi — AI Research Engine
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
            Generates grounded, citation-verified articles and scores them through a three-judge council for evidence, safety, and clarity.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
