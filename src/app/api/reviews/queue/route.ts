import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guard";
import { featureFlags } from "@/lib/feature-flags";
import { getRiskPrioritizedReviewQueue } from "@/lib/services/review-queue";

export async function GET() {
  const authz = await requireRole(Role.REVIEWER);
  if (!authz.ok) return authz.response;
  if (!featureFlags.reviewRiskQueue) {
    return NextResponse.json({ error: "Risk queue is disabled." }, { status: 503 });
  }

  const queue = await getRiskPrioritizedReviewQueue();
  return NextResponse.json({ data: queue });
}
