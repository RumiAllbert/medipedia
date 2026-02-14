import { Breadcrumb } from "@/components/breadcrumb";
import { OrbisGraph } from "@/components/orbis/orbis-graph";

export const metadata = {
  title: "Orbis – Knowledge Graph | Medipedia",
  description:
    "Explore the connections between health topics and articles in an interactive knowledge graph.",
};

export default function OrbisPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Orbis" }]} />

      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Orbis</h1>
      <p className="mt-2 text-muted-foreground">
        Explore the knowledge graph connecting topics and articles. Drag nodes,
        click to inspect, double-click to navigate.
      </p>

      <div className="mt-8">
        <OrbisGraph />
      </div>
    </div>
  );
}
