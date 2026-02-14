import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(Role.ADMIN);
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Role is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate that role is a valid Role enum value
    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        {
          error: `Invalid role. Must be one of: ${Object.values(Role).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error: unknown) {
    console.error("Error updating user role:", error);

    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: string }).code
      : undefined;
    if (code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
