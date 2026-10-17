"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createRideLogRecord, createRideRecord, updateRideRatingRecord } from "@/core/db/repositories";
import { rideSchema } from "@/core/validators/ride.schema";
import { rideLogSchema } from "@/core/validators/ride-log.schema";
import { rideRatingSchema } from "@/core/validators/ride-rating.schema";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) throw new Error("Unauthorized");
}

export async function recordRideCheckIn(input: unknown): Promise<string> {
  await requireSession();
  const log = rideLogSchema.parse(input);
  const id = crypto.randomUUID();
  createRideLogRecord({ ...log, id });
  revalidatePath("/");
  return id;
}

export async function createRide(input: unknown): Promise<string> {
  await requireSession();
  const ride = rideSchema.parse(input);
  const id = ride.id ?? crypto.randomUUID();
  createRideRecord({ ...ride, id });
  revalidatePath(`/parks/${ride.parkId}`);
  return id;
}

export async function updateRideRating(input: unknown): Promise<void> {
  await requireSession();
  const rating = rideRatingSchema.parse(input);
  updateRideRatingRecord(rating.rideId, rating.rating, rating.preferredRow, rating.reviewNotes);
  revalidatePath("/");
}
