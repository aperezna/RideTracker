import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

export async function middleware(request: NextRequest) {
  if (!process.env.APP_MASTER_PASSWORD) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  const authenticated = await isValidSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (authenticated) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/api/auth/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/login).*)"],
};
