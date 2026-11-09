"use server";

import { revalidatePath } from "next/cache";
import { createRideLogRecord, createRideRecord, updateRideManualFields, updateRideRatingRecord } from "@/core/db/repositories";
import { rideSchema } from "@/core/validators/ride.schema";
import { rideLogSchema } from "@/core/validators/ride-log.schema";
import { rideRatingSchema } from "@/core/validators/ride-rating.schema";
import { rideEnrichmentUpdateSchema } from "@/core/validators/ride-enrichment.schema";
import { requireCurrentUserId } from "@/core/auth/current-user";

const requireSession = requireCurrentUserId;

export async function recordRideCheckIn(input: unknown): Promise<string> {
  const userId = await requireSession();
  const log = rideLogSchema.parse(input);
  const id = log.id ?? crypto.randomUUID();
  createRideLogRecord({ ...log, id }, userId);
  revalidatePath("/");
  revalidatePath(`/visits/${log.visitDayId}`);
  return id;
}

export async function createRide(input: unknown): Promise<string> {
  const userId = await requireSession();
  const ride = rideSchema.parse(input);
  const id = ride.id ?? crypto.randomUUID();
  createRideRecord({ ...ride, id }, userId);
  revalidatePath(`/parks/${ride.parkId}`);
  return id;
}

export async function updateRideRating(input: unknown): Promise<void> {
  const userId = await requireSession();
  const rating = rideRatingSchema.parse(input);
  const parkId = updateRideRatingRecord(rating.rideId, userId, rating.rating, rating.preferredRow, rating.reviewNotes);
  revalidatePath("/");
  if (parkId) revalidatePath(`/parks/${parkId}`);
}

export async function updateRideEnrichment(input: unknown): Promise<void> {
  const userId = await requireSession();
  const update = rideEnrichmentUpdateSchema.parse(input);
  const parkId = updateRideManualFields(update.rideId, userId, update);
  revalidatePath("/");
  if (parkId) {
    revalidatePath(`/parks/${parkId}`);
    revalidatePath(`/parks/${parkId}/rides/${update.rideId}`);
  }
}
