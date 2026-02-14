"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { OrbisGraphData, OrbisNode, OrbisEdge } from "@/types/orbis";

export type SimNode = OrbisNode &
  SimulationNodeDatum & { x: number; y: number };
export type SimEdge = OrbisEdge &
  SimulationLinkDatum<SimNode> & { source: SimNode; target: SimNode };

export type SimPositions = {
  nodes: SimNode[];
  edges: SimEdge[];
};

export function useForceSimulation(
  data: OrbisGraphData | null,
  width: number,
  height: number
) {
  const simRef = useRef<Simulation<SimNode, SimEdge> | null>(null);
  const [positions, setPositions] = useState<SimPositions>({
    nodes: [],
    edges: [],
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!data || !width || !height) return;

    // Build sim nodes (preserve fx/fy if node was pinned)
    const prevMap = new Map(positions.nodes.map((n) => [n.id, n]));
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const prev = prevMap.get(n.id);
      return {
        ...n,
        x: prev?.x ?? width / 2 + (Math.random() - 0.5) * width * 0.6,
        y: prev?.y ?? height / 2 + (Math.random() - 0.5) * height * 0.6,
        fx: prev?.fx ?? undefined,
        fy: prev?.fy ?? undefined,
      } as SimNode;
    });

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
    const simEdges: SimEdge[] = data.edges
      .filter(
        (e) =>
          nodeMap.has(typeof e.source === "string" ? e.source : e.source) &&
          nodeMap.has(typeof e.target === "string" ? e.target : e.target)
      )
      .map((e) => ({ ...e }) as unknown as SimEdge);

    // Cleanup previous
    if (simRef.current) simRef.current.stop();
    cancelAnimationFrame(rafRef.current);

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .distance((d) =>
            (d as unknown as OrbisEdge).type === "tag-article" ? 80 : 120
          )
          .strength((d) =>
            (d as unknown as OrbisEdge).type === "tag-article" ? 0.6 : 0.3
          )
      )
      .force(
        "charge",
        forceManyBody<SimNode>().strength((d) =>
          d.type === "tag" ? -400 : -150
        )
      )
      .force("center", forceCenter(width / 2, height / 2).strength(0.05))
      .force(
        "collide",
        forceCollide<SimNode>((d) => (d.type === "tag" ? 30 : 12)).strength(0.7)
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    sim.on("tick", () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPositions({
          nodes: [...simNodes],
          edges: [...(sim.force("link") as ReturnType<typeof forceLink>).links()] as SimEdge[],
        });
      });
    });

    simRef.current = sim;

    return () => {
      sim.stop();
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height]);

  const reheat = useCallback(() => {
    if (simRef.current) {
      simRef.current.alpha(0.8).restart();
    }
  }, []);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    const node = sim.nodes().find((n) => n.id === id);
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }, []);

  const unpinNode = useCallback((id: string) => {
    const sim = simRef.current;
    if (!sim) return;
    const node = sim.nodes().find((n) => n.id === id);
    if (node) {
      node.fx = undefined;
      node.fy = undefined;
    }
  }, []);

  const heatOnDrag = useCallback(() => {
    if (simRef.current) {
      simRef.current.alphaTarget(0.1).restart();
    }
  }, []);

  const coolAfterDrag = useCallback(() => {
    if (simRef.current) {
      simRef.current.alphaTarget(0);
    }
  }, []);

  return { positions, reheat, pinNode, unpinNode, heatOnDrag, coolAfterDrag };
}
