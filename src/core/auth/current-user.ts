import { cookies } from "next/headers";
import { getSessionUserId, SESSION_COOKIE_NAME } from "./session";
import { getUserById } from "@/core/db/repositories";

export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const userId = await getSessionUserId(token);
  if (!userId || !getUserById(userId)) return null;
  return userId;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
