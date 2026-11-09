import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/core/auth/session";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(SESSION_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
