import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";

export async function GET(_request: NextRequest) {
  const authz = await requireRole(Role.CONTRIBUTOR);
  if (!authz.ok) return authz.response;

  const articles = await prisma.article.findMany({
    where: { createdById: authz.session.user.id },
    include: { metadata: true, citations: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: articles });
}
