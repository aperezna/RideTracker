import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

export async function POST(request: Request) {
  const configuredPassword = process.env.APP_MASTER_PASSWORD;
  if (!configuredPassword) return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const expected = Buffer.from(configuredPassword);
  const received = Buffer.from(password);
  const valid = expected.length === received.length && timingSafeEqual(expected, received);
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
