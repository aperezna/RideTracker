import { z } from "zod";

import type { QueueTimesRideStatus } from "./queue-times.service";
import { getPublicEnrichmentSource } from "./public-enrichment";

const BASE_URL = "https://api.themeparks.wiki/v1";
const destinationsSchema = z.object({ destinations: z.array(z.object({ parks: z.array(z.object({ id: z.string(), name: z.string() })).default([]) })).default([]) });
const liveSchema = z.object({ liveData: z.array(z.object({ id: z.string(), name: z.string(), entityType: z.string(), status: z.string().optional(), queue: z.record(z.string(), z.object({ waitTime: z.number().nonnegative().optional() })).optional() })).default([]) });

export type ThemeParksStatus = { source: string; parkClosed: boolean; rides: Record<string, QueueTimesRideStatus>; ridesByName: Record<string, QueueTimesRideStatus> };

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

export type ThemeParksFetch = typeof fetch;

async function fetchJsonWith(url: string, fetchImpl: ThemeParksFetch): Promise<unknown | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const response = await fetchImpl(url, { signal, headers: { accept: "application/json", "user-agent": "RideTracker/1.0" }, next: { revalidate: 60 } } as RequestInit);
    return response.status === 429 || !response.ok ? null : await response.json();
  } catch {
    return null;
  } finally {
    cancel();
  }
}

export async function getThemeParksStatus(parkName: string, fetchImpl: ThemeParksFetch = fetch): Promise<ThemeParksStatus | null> {
  const destinations = destinationsSchema.safeParse(await fetchJsonWith(`${BASE_URL}/destinations`, fetchImpl));
  if (!destinations.success) return null;
  const normalizedParkName = normalize(parkName);
  const target = destinations.data.destinations.flatMap((destination) => destination.parks)
    .sort((left, right) => Number(normalize(right.name) === normalizedParkName) - Number(normalize(left.name) === normalizedParkName))
    .find((park) => normalize(park.name) === normalizedParkName || normalize(park.name).includes(normalizedParkName) || normalizedParkName.includes(normalize(park.name)));
  if (!target) return null;
  const live = liveSchema.safeParse(await fetchJsonWith(`${BASE_URL}/entity/${target.id}/live`, fetchImpl));
  if (!live.success) return null;
  const rides: Record<string, QueueTimesRideStatus> = {};
  const ridesByName: Record<string, QueueTimesRideStatus> = {};
  for (const entity of live.data.liveData.filter((item) => item.entityType === "ATTRACTION")) {
    const isOpen = entity.status === "OPERATING" ? true : entity.status === "DOWN" || entity.status === "CLOSED" || entity.status === "REFURBISHMENT" ? false : null;
    const status = { isOpen, waitTime: entity.queue?.STANDBY?.waitTime ?? null };
    rides[entity.id] = status;
    ridesByName[normalize(entity.name)] = status;
  }
  return { source: getPublicEnrichmentSource("themeparks-wiki")?.name ?? "ThemeParks.wiki", parkClosed: false, rides, ridesByName };
}
