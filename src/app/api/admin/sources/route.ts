import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role, SourceTier } from "@prisma/client";

export async function GET() {
  const authResult = await requireRole(Role.ADMIN);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const policies = await prisma.sourceDomainPolicy.findMany({
      orderBy: {
        domain: "asc",
      },
    });

    return NextResponse.json({ data: policies });
  } catch (error) {
    console.error("Error fetching source domain policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch source domain policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(Role.ADMIN);
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { domain, tier, enabled, notes } = body;

    // Validate required fields
    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required and must be a string" },
        { status: 400 }
      );
    }

    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "Tier is required and must be a string" },
        { status: 400 }
      );
    }

    if (enabled === undefined || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled is required and must be a boolean" },
        { status: 400 }
      );
    }

    // Validate tier is a valid SourceTier enum value
    if (!Object.values(SourceTier).includes(tier as SourceTier)) {
      return NextResponse.json(
        {
          error: `Invalid tier. Must be one of: ${Object.values(SourceTier).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate notes if provided
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes must be a string if provided" },
        { status: 400 }
      );
    }

    const policy = await prisma.sourceDomainPolicy.upsert({
      where: { domain },
      update: {
        tier: tier as SourceTier,
        enabled,
        notes: notes || null,
      },
      create: {
        domain,
        tier: tier as SourceTier,
        enabled,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: policy });
  } catch (error) {
    console.error("Error creating/updating source domain policy:", error);
    return NextResponse.json(
      { error: "Failed to create/update source domain policy" },
      { status: 500 }
    );
  }
}
