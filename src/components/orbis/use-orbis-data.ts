"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { OrbisGraphData, OrbisNode } from "@/types/orbis";

export type OrbisFilters = {
  searchQuery: string;
  selectedTags: string[];
  trustRange: [number, number];
};

export function useOrbisData() {
  const [raw, setRaw] = useState<OrbisGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrbisFilters>({
    searchQuery: "",
    selectedTags: [],
    trustRange: [0, 100],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/orbis");
        if (!res.ok) throw new Error("Failed to load graph data");
        const json = await res.json();
        if (!cancelled) setRaw(json.data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    if (!raw) return [];
    return raw.nodes
      .filter((n) => n.type === "tag")
      .sort((a, b) => (b.articleCount ?? 0) - (a.articleCount ?? 0))
      .map((n) => n.label);
  }, [raw]);

  const filteredData = useMemo(() => {
    if (!raw) return null;

    const { searchQuery, selectedTags, trustRange } = filters;
    const query = searchQuery.toLowerCase();

    // Start with all nodes, then filter
    let visibleNodes = new Set<string>();

    // Determine which article nodes pass filters
    const articleNodes = raw.nodes.filter((n): n is OrbisNode & { type: "article" } => {
      if (n.type !== "article") return false;
      const trust = n.trustScore ?? 0;
      if (trust < trustRange[0] || trust > trustRange[1]) return false;
      if (query && !n.label.toLowerCase().includes(query)) return false;
      return true;
    });

    for (const a of articleNodes) visibleNodes.add(a.id);

    // If tags are selected, only keep articles connected to those tags
    if (selectedTags.length > 0) {
      const tagIds = new Set(selectedTags.map((t) => `tag:${t}`));
      const connectedArticles = new Set<string>();
      for (const edge of raw.edges) {
        if (edge.type === "tag-article" && tagIds.has(edge.source as string)) {
          connectedArticles.add(edge.target as string);
        }
      }
      visibleNodes = new Set([...visibleNodes].filter((id) => connectedArticles.has(id)));
    }

    // Include tag nodes that connect to visible articles
    const tagNodeIds = new Set<string>();
    for (const edge of raw.edges) {
      if (
        edge.type === "tag-article" &&
        visibleNodes.has(edge.target as string)
      ) {
        tagNodeIds.add(edge.source as string);
      }
    }
    // Also include explicitly selected tags even if no articles visible
    for (const t of selectedTags) tagNodeIds.add(`tag:${t}`);

    // If search matches a tag, include it
    if (query) {
      for (const n of raw.nodes) {
        if (n.type === "tag" && n.label.toLowerCase().includes(query)) {
          tagNodeIds.add(n.id);
        }
      }
    }

    for (const id of tagNodeIds) visibleNodes.add(id);

    const nodes = raw.nodes.filter((n) => visibleNodes.has(n.id));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = raw.edges.filter(
      (e) =>
        nodeIds.has(e.source as string) && nodeIds.has(e.target as string)
    );

    return { nodes, edges } as OrbisGraphData;
  }, [raw, filters]);

  const setSearchQuery = useCallback(
    (q: string) => setFilters((f) => ({ ...f, searchQuery: q })),
    []
  );
  const setSelectedTags = useCallback(
    (tags: string[]) => setFilters((f) => ({ ...f, selectedTags: tags })),
    []
  );
  const setTrustRange = useCallback(
    (range: [number, number]) =>
      setFilters((f) => ({ ...f, trustRange: range })),
    []
  );

  return {
    raw,
    filteredData,
    loading,
    error,
    filters,
    allTags,
    setSearchQuery,
    setSelectedTags,
    setTrustRange,
  };
}
