"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrbisData } from "./use-orbis-data";
import { useForceSimulation } from "./use-force-simulation";
import { OrbisCanvas } from "./orbis-canvas";
import { OrbisControls } from "./orbis-controls";
import { OrbisLegend } from "./orbis-legend";
import { OrbisNodePanel } from "./orbis-node-panel";

export function OrbisGraph() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    filteredData,
    loading,
    error,
    filters,
    allTags,
    setSearchQuery,
    setSelectedTags,
    setTrustRange,
  } = useOrbisData();

  const { positions, reheat, pinNode, heatOnDrag, coolAfterDrag } =
    useForceSimulation(filteredData, dimensions.width, dimensions.height);

  const zoomRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitAll: () => void;
  } | null>(null);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reheat when filters change
  useEffect(() => {
    reheat();
  }, [filteredData, reheat]);

  const handleDoubleClick = useCallback(
    (id: string) => {
      const node = filteredData?.nodes.find((n) => n.id === id);
      if (node?.slug) {
        router.push(`/articles/${node.slug}`);
      }
    },
    [filteredData, router]
  );

  const handleNavigateToNode = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border bg-card p-6 text-sm text-muted-foreground">
        Failed to load graph data. Please try again later.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border bg-card shadow-sm",
        isFullscreen && "fixed inset-0 z-50 rounded-none"
      )}
    >
      <OrbisControls
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        allTags={allTags}
        selectedTags={filters.selectedTags}
        onSelectedTagsChange={setSelectedTags}
        trustRange={filters.trustRange}
        onTrustRangeChange={setTrustRange}
        onZoomIn={() => zoomRef.current?.zoomIn()}
        onZoomOut={() => zoomRef.current?.zoomOut()}
        onFitAll={() => zoomRef.current?.fitAll()}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
      />

      <div className="flex" style={{ height: isFullscreen ? "calc(100vh - 96px)" : "min(600px, 70vh)" }}>
        {/* Canvas area */}
        <div ref={containerRef} className="relative flex-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : positions.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No nodes match current filters.
            </div>
          ) : (
            <OrbisCanvas
              nodes={positions.nodes}
              edges={positions.edges}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
              onDoubleClickNode={handleDoubleClick}
              pinNode={pinNode}
              heatOnDrag={heatOnDrag}
              coolAfterDrag={coolAfterDrag}
              zoomRef={zoomRef}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedNodeId && filteredData && (
          <OrbisNodePanel
            nodeId={selectedNodeId}
            data={filteredData}
            onClose={() => setSelectedNodeId(null)}
            onNavigateToNode={handleNavigateToNode}
          />
        )}
      </div>

      <OrbisLegend />
    </div>
  );
}
