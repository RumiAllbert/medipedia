import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddSourceForm } from "./add-source-form";

async function getSources() {
  return prisma.sourceDomainPolicy.findMany({
    orderBy: { domain: "asc" },
  });
}

const tierVariant: Record<string, "success" | "warning" | "destructive"> = {
  A: "success",
  B: "warning",
  C: "destructive",
};

export default async function SourcesPage() {
  const sources = await getSources();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Source Domain Policies</h1>
          <p className="mt-1 text-muted-foreground">
            Manage citation source tiers and domain policies.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AddSourceForm />
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.domain}>
                <TableCell className="font-medium">{source.domain}</TableCell>
                <TableCell>
                  <Badge variant={tierVariant[source.tier] ?? "neutral"}>
                    Tier {source.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={source.enabled ? "success" : "destructive"}>
                    {source.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {source.notes ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(source.updatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {sources.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No source policies configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
