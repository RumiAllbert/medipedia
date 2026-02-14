"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import "d3-transition";
import type { SimNode, SimEdge } from "./use-force-simulation";

type OrbisCanvasProps = {
  nodes: SimNode[];
  edges: SimEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  onDoubleClickNode: (id: string) => void;
  pinNode: (id: string, x: number, y: number) => void;
  heatOnDrag: () => void;
  coolAfterDrag: () => void;
  zoomRef: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitAll: () => void;
  } | null>;
};

function nodeRadius(node: SimNode) {
  if (node.type === "tag") {
    return 14 + Math.log2(Math.max(node.articleCount ?? 1, 1)) * 3;
  }
  return 6;
}

function nodeFill(node: SimNode) {
  if (node.type === "tag") return "hsl(var(--primary))";
  const trust = node.trustScore ?? 0;
  if (trust >= 85) return "#10b981";
  if (trust >= 70) return "#f59e0b";
  return "#f87171";
}

function edgeSourceId(edge: SimEdge): string {
  return (edge.source as SimNode).id;
}

function edgeTargetId(edge: SimEdge): string {
  return (edge.target as SimNode).id;
}

function edgeSourcePos(edge: SimEdge): { x: number; y: number } {
  const s = edge.source as SimNode;
  return { x: s.x, y: s.y };
}

function edgeTargetPos(edge: SimEdge): { x: number; y: number } {
  const t = edge.target as SimNode;
  return { x: t.x, y: t.y };
}

export function OrbisCanvas({
  nodes,
  edges,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  onDoubleClickNode,
  pinNode,
  heatOnDrag,
  coolAfterDrag,
  zoomRef,
}: OrbisCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Track drag state in a ref so pointer handlers stay stable
  const dragRef = useRef<{ nodeId: string; dragged: boolean } | null>(null);

  // Set up zoom behavior
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((event) => {
        // Disable zoom when dragging a node
        if (dragRef.current) return false;
        return !event.button;
      })
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    select(svg).call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  // Expose zoom controls
  useEffect(() => {
    zoomRef.current = {
      zoomIn: () => {
        const svg = svgRef.current;
        if (!svg || !zoomBehaviorRef.current) return;
        const sel = select(svg);
        sel.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
      },
      zoomOut: () => {
        const svg = svgRef.current;
        if (!svg || !zoomBehaviorRef.current) return;
        const sel = select(svg);
        sel.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
      },
      fitAll: () => {
        const svg = svgRef.current;
        if (!svg || !zoomBehaviorRef.current || nodes.length === 0) return;
        const padding = 60;
        const svgRect = svg.getBoundingClientRect();
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const n of nodes) {
          const r = nodeRadius(n);
          minX = Math.min(minX, n.x - r);
          minY = Math.min(minY, n.y - r);
          maxX = Math.max(maxX, n.x + r);
          maxY = Math.max(maxY, n.y + r);
        }
        const graphW = maxX - minX + padding * 2;
        const graphH = maxY - minY + padding * 2;
        const scale = Math.min(
          svgRect.width / graphW,
          svgRect.height / graphH,
          2
        );
        const tx = svgRect.width / 2 - ((minX + maxX) / 2) * scale;
        const ty = svgRect.height / 2 - ((minY + maxY) / 2) * scale;

        const sel = select(svg);
        sel
          .transition()
          .duration(500)
          .call(
            zoomBehaviorRef.current.transform,
            zoomIdentity.translate(tx, ty).scale(scale)
          );
      },
    };
  }, [zoomRef, nodes]);

  // Convert screen coords to graph coords using current zoom transform
  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const t = transformRef.current;
      return {
        x: (clientX - rect.left - t.x) / t.k,
        y: (clientY - rect.top - t.y) / t.k,
      };
    },
    []
  );

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, node: SimNode) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = { nodeId: node.id, dragged: false };
      heatOnDrag();
      const pos = screenToGraph(e.clientX, e.clientY);
      pinNode(node.id, pos.x, pos.y);
    },
    [heatOnDrag, pinNode, screenToGraph]
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current.dragged = true;
      const pos = screenToGraph(e.clientX, e.clientY);
      pinNode(dragRef.current.nodeId, pos.x, pos.y);
    },
    [pinNode, screenToGraph]
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const wasDrag = dragRef.current.dragged;
      const nodeId = dragRef.current.nodeId;
      dragRef.current = null;
      coolAfterDrag();

      // If it wasn't a drag, treat as a click
      if (!wasDrag) {
        e.stopPropagation();
        onSelectNode(nodeId === selectedNodeId ? null : nodeId);
      }
    },
    [coolAfterDrag, onSelectNode, selectedNodeId]
  );

  const connectedIds = useCallback(
    (nodeId: string) => {
      const ids = new Set<string>();
      for (const e of edges) {
        const sId = edgeSourceId(e);
        const tId = edgeTargetId(e);
        if (sId === nodeId) ids.add(tId);
        if (tId === nodeId) ids.add(sId);
      }
      return ids;
    },
    [edges]
  );

  const activeId = hoveredNodeId ?? selectedNodeId;
  const connected = activeId ? connectedIds(activeId) : null;

  return (
    <svg
      ref={svgRef}
      className="h-full w-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onClick={() => onSelectNode(null)}
    >
      <defs>
        <radialGradient id="orbis-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="1" />
          <stop
            offset="100%"
            stopColor="hsl(var(--card))"
            stopOpacity="0.85"
          />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#orbis-bg)" />

      <g
        ref={gRef}
        transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
      >
        {/* Edges */}
        {edges.map((edge) => {
          const src = edgeSourcePos(edge);
          const tgt = edgeTargetPos(edge);
          const sId = edgeSourceId(edge);
          const tId = edgeTargetId(edge);

          const isHighlighted =
            activeId !== null && (sId === activeId || tId === activeId);
          const isDimmed = activeId !== null && !isHighlighted;

          return (
            <line
              key={edge.id}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity={
                isDimmed ? 0.05 : edge.type === "article-article" ? 0.3 : 0.2
              }
              strokeWidth={
                edge.type === "article-article"
                  ? Math.max(1, (edge.score ?? 0.5) * 3)
                  : 1
              }
              strokeDasharray={
                edge.type === "article-article" ? "4 3" : undefined
              }
              style={{ transition: "stroke-opacity 0.2s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const r = nodeRadius(node);
          const fill = nodeFill(node);
          const isSelected = node.id === selectedNodeId;
          const isHovered = node.id === hoveredNodeId;
          const isDimmed =
            activeId !== null &&
            node.id !== activeId &&
            connected !== null &&
            !connected.has(node.id);

          return (
            <g key={node.id}>
              {(isHovered || isSelected) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 4}
                  fill="none"
                  stroke="hsl(var(--ring))"
                  strokeWidth={2}
                  opacity={0.7}
                />
              )}
              <circle
                className="orbis-node"
                cx={node.x}
                cy={node.y}
                r={r}
                fill={fill}
                opacity={isDimmed ? 0.15 : 1}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                onMouseEnter={() => onHoverNode(node.id)}
                onMouseLeave={() => onHoverNode(null)}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onDoubleClickNode(node.id);
                }}
              />
              {(node.type === "tag" || isHovered || isSelected) && (
                <text
                  x={node.x}
                  y={node.y - r - 6}
                  textAnchor="middle"
                  className="select-none fill-foreground text-[10px] font-medium"
                  opacity={isDimmed ? 0.15 : 0.9}
                  style={{ pointerEvents: "none", transition: "opacity 0.2s" }}
                >
                  {node.label.length > 24
                    ? node.label.slice(0, 22) + "\u2026"
                    : node.label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
