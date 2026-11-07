import { z } from "zod";

import { rideCategories } from "../db/schema";

const DEFAULT_BASE_URL = "https://queue-times.com";
const REQUEST_TIMEOUT_MS = 5_000;
const QUEUE_TIMES_CACHE_SECONDS = 600;

const externalRideSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  is_open: z.boolean().optional(),
  wait_time: z.number().int().nonnegative().optional(),
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
  category: (typeof rideCategories)[number] | null;
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

export type QueueTimesRideStatus = {
  isOpen: boolean | null;
  waitTime: number | null;
};

export type QueueTimesStatus = {
  parkClosed: boolean;
  rides: Record<string, QueueTimesRideStatus>;
};

function mapCategory(category: string | undefined): ImportedRide["category"] {
  const normalized = category?.toUpperCase().replace(/[ -]/g, "_");
  if (!normalized) return null;
  if (normalized === "COASTER" || normalized === "ROLLER_COASTER") return "COASTER";
  if (normalized === "DARK_RIDE" || normalized === "DARKRIDE") return "DARK_RIDE";
  if (normalized === "WATER" || normalized === "WATER_RIDE") return "WATER";
  if (normalized === "SHOW") return "SHOW";
  if (normalized === "FLAT_RIDE" || normalized === "FLAT") return "FLAT_RIDE";
  return rideCategories.includes(normalized as (typeof rideCategories)[number]) ? (normalized as (typeof rideCategories)[number]) : null;
}

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

async function fetchJson(url: string, fetchImpl: QueueTimesFetch, cacheSeconds?: number): Promise<unknown> {
  const timeout = createTimeoutSignal();
  try {
    const response = await fetchImpl(url, {
      signal: timeout.signal,
      headers: { accept: "application/json" },
      ...(cacheSeconds ? { next: { revalidate: cacheSeconds } } : {}),
    } as RequestInit);
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
  return { ...park, rides: detailRides.map((ride) => {
    const existingRide = park.rides.find((candidate) => candidate.externalId === String(ride.id));
    return {
      externalId: String(ride.id),
      name: ride.name,
      category: mapCategory(ride.category) ?? existingRide?.category ?? null,
      manufacturer: ride.manufacturer ?? existingRide?.manufacturer ?? "",
    };
  }) };
}

export async function getQueueTimesStatus(
  externalId: string,
  fetchImpl: QueueTimesFetch = fetch,
  baseUrl = process.env.QUEUE_TIMES_BASE_URL ?? DEFAULT_BASE_URL,
): Promise<QueueTimesStatus | null> {
  let payload: unknown;
  try {
    payload = await fetchJson(`${baseUrl.replace(/\/$/, "")}/parks/${encodeURIComponent(externalId)}/queue_times.json`, fetchImpl, QUEUE_TIMES_CACHE_SECONDS);
  } catch {
    return null;
  }

  const detail = queueTimesDetailSchema.safeParse(payload);
  if (!detail.success) return null;

  const detailRides = [...(detail.data.rides ?? []), ...(detail.data.lands ?? []).flatMap((land) => land.rides ?? [])];
  const rides = Object.fromEntries(detailRides.map((ride) => [String(ride.id), {
    isOpen: ride.is_open ?? null,
    waitTime: ride.wait_time ?? null,
  }]));
  const knownOpenStates = detailRides.map((ride) => ride.is_open).filter((isOpen): isOpen is boolean => isOpen !== undefined);

  return {
    parkClosed: knownOpenStates.length > 0 && knownOpenStates.every((isOpen) => !isOpen),
    rides,
  };
}
