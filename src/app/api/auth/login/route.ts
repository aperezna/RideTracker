import { NextResponse } from "next/server";

import { verifyPassword } from "@/core/auth/password";
import { getUserByEmail } from "@/core/db/repositories";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const user = getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return response;
}
