import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

import { prisma } from "@/lib/prisma";
import { authSecret } from "@/lib/auth";

const COOKIE_NAME = "authjs.session-token";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = await request.json();
  const email = body.email;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: `User "${email}" not found. Run: npm run db:seed` },
      { status: 404 }
    );
  }

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    secret: authSecret!,
    salt: COOKIE_NAME,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
