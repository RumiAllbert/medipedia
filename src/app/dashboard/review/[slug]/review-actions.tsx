"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type ReviewActionsProps = {
  articleId: string;
  publishEligible: boolean;
};

export function ReviewActions({ articleId, publishEligible }: ReviewActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: "approve" | "reject" | "request-changes") => {
    if (!notes.trim() && action !== "approve") {
      toast.error("Please add notes explaining your decision");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${articleId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: notes || "Approved" }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? `Failed to ${action}`);
        return;
      }

      const labels = {
        approve: "Article approved and published",
        reject: "Article rejected",
        "request-changes": "Changes requested",
      };
      toast.success(labels[action]);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Review Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="notes">Review notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add feedback for the author..."
            className="mt-1.5"
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleAction("approve")}
            disabled={isSubmitting || !publishEligible}
            className="w-full gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve & Publish
          </Button>
          {!publishEligible && (
            <p className="text-xs text-muted-foreground">
              Council scoring must deem article publish-eligible before approval.
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => handleAction("request-changes")}
            disabled={isSubmitting}
            className="w-full gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Request Changes
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleAction("reject")}
            disabled={isSubmitting}
            className="w-full gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
