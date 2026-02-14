export type OrbisNodeType = "tag" | "article";

export type OrbisNode = {
  id: string;
  type: OrbisNodeType;
  label: string;
  slug?: string;
  trustScore?: number;
  confidenceLabel?: string;
  articleCount?: number;
};

export type OrbisEdge = {
  id: string;
  source: string;
  target: string;
  type: "tag-article" | "article-article";
  score?: number;
};

export type OrbisGraphData = { nodes: OrbisNode[]; edges: OrbisEdge[] };
