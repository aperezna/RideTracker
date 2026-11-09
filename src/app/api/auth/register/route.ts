import { NextResponse } from "next/server";
import { hashPassword } from "@/core/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";
import { createUserRecord, getUserByEmail } from "@/core/db/repositories";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (password.length < 10) return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
  if (getUserByEmail(email)) return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  const userId = createUserRecord(email, await hashPassword(password));
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
