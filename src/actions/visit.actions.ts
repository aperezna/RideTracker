"use server";

import { revalidatePath } from "next/cache";
import { createVisitDayRecord, updateVisitDayRecord } from "@/core/db/repositories";
import { updateVisitDaySchema, visitDaySchema } from "@/core/validators/visit-day.schema";
import { requireCurrentUserId } from "@/core/auth/current-user";

const requireSession = requireCurrentUserId;

export async function recordVisitDay(input: unknown): Promise<string> {
  const userId = await requireSession();
  const visit = visitDaySchema.parse(input);
  const id = crypto.randomUUID();
  createVisitDayRecord({ ...visit, id, createdAt: new Date() }, userId);
  revalidatePath(`/parks/${visit.parkId}`);
  return id;
}

export async function updateVisitDay(visitDayId: string, input: unknown): Promise<void> {
  const userId = await requireSession();
  const visit = updateVisitDaySchema.parse(input);
  updateVisitDayRecord(visitDayId, userId, {
    visitDate: visit.visitDate,
    tripNotes: visit.tripNotes ?? null,
    durationMinutes: visit.durationMinutes ?? null,
    weather: visit.weather ?? null,
    company: visit.company ?? null,
    overallRating: visit.overallRating ?? null,
  });
  revalidatePath(`/visits/${visitDayId}`);
  revalidatePath("/parks");
}
