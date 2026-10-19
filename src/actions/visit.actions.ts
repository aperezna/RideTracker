"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createVisitDayRecord, updateVisitDayNotesRecord } from "@/core/db/repositories";
import { visitDaySchema } from "@/core/validators/visit-day.schema";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) throw new Error("Unauthorized");
}

export async function recordVisitDay(input: unknown): Promise<string> {
  await requireSession();
  const visit = visitDaySchema.parse(input);
  const id = crypto.randomUUID();
  createVisitDayRecord({ ...visit, id, createdAt: new Date() });
  revalidatePath(`/parks/${visit.parkId}`);
  return id;
}

export async function updateVisitDayNotes(visitDayId: string, tripNotes: string): Promise<void> {
  await requireSession();
  updateVisitDayNotesRecord(visitDayId, tripNotes);
  revalidatePath(`/visits/${visitDayId}`);
  revalidatePath("/parks");
}
