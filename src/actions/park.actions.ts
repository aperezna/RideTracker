"use server";

import { revalidatePath } from "next/cache";
import { createParkRecord, deleteParkRecord, enqueueRideCategoryJobs, importParkRecord, updateRideManufacturerRecord, updateParkNotesRecord, updateParkStatusRecord } from "@/core/db/repositories";
import { getExternalPark, searchExternalParks, type ImportedPark } from "@/core/services/queue-times.service";
import { getWikipediaManufacturer } from "@/core/services/wikimedia.service";
import { parkSchema } from "@/core/validators/park.schema";

import { requireCurrentUserId } from "@/core/auth/current-user";

const requireSession = requireCurrentUserId;

function importedParkValues(park: ImportedPark, userId: string) {
  return {
    id: `user-${userId}-external-${park.externalId}`,
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

async function enrichRideManufacturers(parkId: string, userId: string, park: ImportedPark): Promise<void> {
  for (const ride of park.rides) {
    if (!ride.manufacturer) {
      const manufacturer = await getWikipediaManufacturer(ride.name);
       if (manufacturer) updateRideManufacturerRecord(`${parkId}-ride-${ride.externalId}`, userId, manufacturer);
    }
  }
}

export async function refreshParkCatalog(externalId: string): Promise<void> {
  const userId = await requireSession();
  const park = await getExternalPark(externalId);
  const storedParkId = importedParkValues(park, userId).id;
  importParkRecord(importedParkValues(park, userId), park.rides.map((ride) => ({
    id: `${storedParkId}-ride-${ride.externalId}`,
    parkId: storedParkId,
    externalId: ride.externalId,
    name: ride.name,
    category: ride.category ?? "UNKNOWN",
    manufacturer: ride.manufacturer,
  })), userId);
  enqueueRideCategoryJobs(storedParkId, park.rides.map((ride) => `${storedParkId}-ride-${ride.externalId}`), userId);
  void enrichRideManufacturers(storedParkId, userId, park);
  revalidatePath(`/parks/${storedParkId}`);
}

export async function searchParks(query: string): Promise<ImportedPark[]> {
  await requireSession();
  if (query.trim().length < 2) return [];
  return searchExternalParks(query);
}

export async function importPark(externalId: string): Promise<string> {
  const userId = await requireSession();
  const imported = await getExternalPark(externalId);
  const parkId = importedParkValues(imported, userId).id;
  importParkRecord(importedParkValues(imported, userId), imported.rides.map((ride) => ({
        id: `${parkId}-ride-${ride.externalId}`,
        parkId,
        externalId: ride.externalId,
        name: ride.name,
        category: ride.category ?? "UNKNOWN",
        manufacturer: ride.manufacturer,
       })), userId);
  enqueueRideCategoryJobs(parkId, imported.rides.map((ride) => `${parkId}-ride-${ride.externalId}`), userId);
  void enrichRideManufacturers(parkId, userId, imported);
  revalidatePath("/");
  return parkId;
}

export async function createPark(input: unknown): Promise<string> {
  const userId = await requireSession();
  const park = parkSchema.parse(input);
  const id = park.id ?? crypto.randomUUID();
  createParkRecord({ ...park, id, createdAt: new Date() }, userId);
  revalidatePath("/");
  return id;
}

export async function updateParkTripNotes(parkId: string, tripNotes: string): Promise<void> {
  const userId = await requireSession();
  updateParkNotesRecord(parkId, userId, tripNotes);
  revalidatePath("/");
  revalidatePath("/parks");
  revalidatePath(`/parks/${parkId}`);
}

export async function updateParkStatus(parkId: string, status: "WISHLIST" | "PLANNED" | "VISITED"): Promise<void> {
  const userId = await requireSession();
  updateParkStatusRecord(parkId, userId, status);
  revalidatePath("/");
  revalidatePath("/parks");
  revalidatePath(`/parks/${parkId}`);
}

export async function deletePark(parkId: string): Promise<void> {
  const userId = await requireSession();
  if (!parkId.trim()) throw new Error("Park id is required");
  deleteParkRecord(parkId, userId);
  revalidatePath("/");
  revalidatePath("/parks");
}
