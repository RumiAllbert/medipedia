import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";

export type AuthorizedSession = {
  user: {
    id: string;
    role: Role;
    email?: string | null;
  };
};

export async function requireRole(requiredRole: Role): Promise<
  | {
      ok: true;
      session: AuthorizedSession;
    }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id || !hasRole(session.user.role, requiredRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    session: {
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
      },
    },
  };
}
