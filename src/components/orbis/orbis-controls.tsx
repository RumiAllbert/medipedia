"use client";

import { Search, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrbisControlsProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  trustRange: [number, number];
  onTrustRangeChange: (range: [number, number]) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function OrbisControls({
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onSelectedTagsChange,
  trustRange,
  onTrustRangeChange,
  onZoomIn,
  onZoomOut,
  onFitAll,
  isFullscreen,
  onToggleFullscreen,
}: OrbisControlsProps) {
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onSelectedTagsChange([...selectedTags, tag]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-card/50 px-4 py-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search nodes…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-9 text-sm"
        />
      </div>

      {/* Tag pills (show first 8) */}
      <div className="flex flex-wrap gap-1.5">
        {allTags.slice(0, 8).map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className={cn(
              "cursor-pointer text-xs transition-colors",
              selectedTags.includes(tag) && "bg-primary text-primary-foreground"
            )}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
        {selectedTags.length > 0 && (
          <button
            onClick={() => onSelectedTagsChange([])}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Trust range */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Trust:</span>
        <select
          value={trustRange[0]}
          onChange={(e) =>
            onTrustRangeChange([Number(e.target.value), trustRange[1]])
          }
          className="h-7 rounded border bg-background px-1.5 text-xs"
        >
          <option value={0}>0+</option>
          <option value={50}>50+</option>
          <option value={70}>70+</option>
          <option value={85}>85+</option>
        </select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom + fullscreen controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} title="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} title="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFitAll} title="Fit all">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
