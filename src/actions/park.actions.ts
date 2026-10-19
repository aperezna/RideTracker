"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createParkRecord, importParkRecord, updateParkNotesRecord, updateParkStatusRecord } from "@/core/db/repositories";
import { getExternalPark, searchExternalParks, type ImportedPark } from "@/core/services/queue-times.service";
import { parkSchema } from "@/core/validators/park.schema";

import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) throw new Error("Unauthorized");
}

function importedParkValues(park: ImportedPark) {
  return {
    id: `external-${park.externalId}`,
    externalId: park.externalId,
    name: park.name,
    country: park.country,
    city: park.city,
    latitude: park.latitude,
    longitude: park.longitude,
    status: "WISHLIST" as const,
    tripNotes: "",
    createdAt: new Date(),
  };
}

export async function searchParks(query: string): Promise<ImportedPark[]> {
  await requireSession();
  if (query.trim().length < 2) return [];
  return searchExternalParks(query);
}

export async function importPark(externalId: string): Promise<string> {
  await requireSession();
  const imported = await getExternalPark(externalId);
  const parkId = importedParkValues(imported).id;
  importParkRecord(importedParkValues(imported), imported.rides.map((ride) => ({
        id: `${parkId}-ride-${ride.externalId}`,
        parkId,
        externalId: ride.externalId,
        name: ride.name,
        category: ride.category,
        manufacturer: ride.manufacturer,
      })));
  revalidatePath("/");
  return parkId;
}

export async function createPark(input: unknown): Promise<string> {
  await requireSession();
  const park = parkSchema.parse(input);
  const id = park.id ?? crypto.randomUUID();
  createParkRecord({ ...park, id, createdAt: new Date() });
  revalidatePath("/");
  return id;
}

export async function updateParkTripNotes(parkId: string, tripNotes: string): Promise<void> {
  await requireSession();
  updateParkNotesRecord(parkId, tripNotes);
  revalidatePath("/");
}

export async function updateParkStatus(parkId: string, status: "WISHLIST" | "PLANNED" | "VISITED"): Promise<void> {
  await requireSession();
  updateParkStatusRecord(parkId, status);
  revalidatePath("/");
  revalidatePath("/parks");
  revalidatePath(`/parks/${parkId}`);
}
