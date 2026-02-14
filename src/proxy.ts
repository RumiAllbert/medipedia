import { NextResponse, type NextRequest } from "next/server";

function isProtectedPath(pathname: string, method: string): boolean {
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname === "/api/articles" && method === "POST") return true;
  if (pathname.startsWith("/api/articles/") && pathname.endsWith("/submit")) return true;
  if (pathname.startsWith("/api/reviews/") && pathname.endsWith("/approve")) return true;
  if (pathname.startsWith("/api/ai/enrich/")) return true;
  if (pathname === "/api/articles/generate-from-topic") return true;
  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token") ||
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token"),
  );
}

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname, request.method)) {
    return NextResponse.next();
  }
  if (!hasSessionCookie(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
