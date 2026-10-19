import { z } from "zod";

import { rideCategories } from "../db/schema";

const DEFAULT_BASE_URL = "https://queue-times.com";
const REQUEST_TIMEOUT_MS = 5_000;

const externalRideSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  is_open: z.boolean().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
});

const externalParkSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  rides: z.array(externalRideSchema).optional(),
});

const parksResponseSchema = z.union([
  z.object({
    parks: z.array(externalParkSchema).optional(),
    continents: z.array(z.object({ parks: z.array(externalParkSchema).optional() })).optional(),
  }),
  z.array(z.object({ parks: z.array(externalParkSchema).optional() })),
]);

const queueTimesDetailSchema = z.object({
  rides: z.array(externalRideSchema).optional(),
  lands: z.array(z.object({ rides: z.array(externalRideSchema).optional() })).optional(),
}).passthrough();

export type ImportedRide = {
  externalId: string;
  name: string;
  category: (typeof rideCategories)[number];
  manufacturer: string;
};

export type ImportedPark = {
  externalId: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  rides: ImportedRide[];
};

export type QueueTimesFetch = typeof fetch;

function mapCategory(category: string | undefined): ImportedRide["category"] {
  const normalized = category?.toUpperCase().replace(/[ -]/g, "_");
  return rideCategories.includes(normalized as ImportedRide["category"])
    ? (normalized as ImportedRide["category"])
    : "FLAT_RIDE";
}

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

async function fetchJson(url: string, fetchImpl: QueueTimesFetch): Promise<unknown> {
  const timeout = createTimeoutSignal();
  try {
    const response = await fetchImpl(url, { signal: timeout.signal, headers: { accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Queue-Times request failed with status ${response.status}`);
    }
    return response.json();
  } finally {
    timeout.cancel();
  }
}

function normalizePark(park: z.infer<typeof externalParkSchema>): ImportedPark {
  return {
    externalId: String(park.id),
    name: park.name,
    country: park.country ?? "Unknown",
    city: park.city ?? "Unknown",
    latitude: park.latitude ?? 0,
    longitude: park.longitude ?? 0,
    rides: (park.rides ?? []).map((ride) => ({
      externalId: String(ride.id),
      name: ride.name,
      category: mapCategory(ride.category),
      manufacturer: ride.manufacturer ?? "",
    })),
  };
}

export async function searchExternalParks(
  query: string,
  fetchImpl: QueueTimesFetch = fetch,
  baseUrl = process.env.QUEUE_TIMES_BASE_URL ?? DEFAULT_BASE_URL,
): Promise<ImportedPark[]> {
  const data = parksResponseSchema.parse(await fetchJson(`${baseUrl.replace(/\/$/, "")}/parks.json`, fetchImpl));
  const parks = Array.isArray(data)
    ? data.flatMap((continent) => continent.parks ?? [])
    : [...(data.parks ?? []), ...(data.continents ?? []).flatMap((continent) => continent.parks ?? [])];
  const normalizedQuery = query.trim().toLowerCase();
  return parks.filter((park) => park.name.toLowerCase().includes(normalizedQuery)).map(normalizePark);
}

export async function getExternalPark(
  externalId: string,
  fetchImpl: QueueTimesFetch = fetch,
  baseUrl = process.env.QUEUE_TIMES_BASE_URL ?? DEFAULT_BASE_URL,
): Promise<ImportedPark> {
  const matches = await searchExternalParks("", fetchImpl, baseUrl);
  const park = matches.find((candidate) => candidate.externalId === externalId);
  if (!park) {
    throw new Error("External park was not found");
  }
  let detailPayload: unknown;
  try {
    detailPayload = await fetchJson(`${baseUrl.replace(/\/$/, "")}/parks/${encodeURIComponent(externalId)}/queue_times.json`, fetchImpl);
  } catch {
    return park;
  }
  const detail = queueTimesDetailSchema.safeParse(detailPayload);
  if (!detail.success) return park;
  const detailRides = [...(detail.data.rides ?? []), ...(detail.data.lands ?? []).flatMap((land) => land.rides ?? [])];
  return { ...park, rides: detailRides.map((ride) => ({
    externalId: String(ride.id),
    name: ride.name,
    category: mapCategory(ride.category),
    manufacturer: ride.manufacturer ?? "",
  })) };
}
