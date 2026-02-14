"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const reportOptions = [
  { value: "ACCURACY", label: "Accuracy issue" },
  { value: "SAFETY", label: "Safety concern" },
  { value: "OUTDATED", label: "Outdated information" },
  { value: "OTHER", label: "Other" },
] as const;

export function ReportIssueDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<(typeof reportOptions)[number]["value"]>("ACCURACY");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (details.trim().length < 16) {
      toast.error("Please add at least 16 characters of detail.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/articles/${slug}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, details: details.trim() }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(err?.error ?? "Failed to submit report.");
        return;
      }

      toast.success("Issue reported. Thank you.");
      setDetails("");
      setType("ACCURACY");
      setOpen(false);
    } catch {
      toast.error("Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flag className="mr-2 h-3.5 w-3.5" />
          Report issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Flag potential safety, accuracy, or freshness issues for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Issue type</Label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="report-details">Details</Label>
            <Textarea
              id="report-details"
              className="mt-1.5 min-h-[120px]"
              placeholder="Describe what appears incorrect, unsafe, outdated, or unclear."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
