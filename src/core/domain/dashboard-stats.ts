import type { ParkStatus, RideCategory } from "../db/schema";
import type { DomainRideLog } from "./coaster-stats";

export type DomainPark = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  status: ParkStatus;
};

export type ParkStatusCounts = {
  visited: number;
  planned: number;
  wishlist: number;
};

export type CountrySummary = {
  country: string;
  total: number;
  visited: number;
  planned: number;
  wishlist: number;
};

export type TopRideRow = {
  id: string;
  name: string;
  parkName: string;
  category: RideCategory;
  totalLaps: number;
  rating: number;
  preferredRow: string | null;
};

export type DashboardView = {
  uniqueCoasterCount: number;
  visitedParks: number;
  plannedParks: number;
  wishlistParks: number;
  totalLaps: number;
  topCountry: string;
  topRides: TopRideRow[];
  parks: DomainPark[];
  countries: CountrySummary[];
};

export function countParksByStatus(parks: DomainPark[]): ParkStatusCounts {
  return {
    visited: parks.filter((park) => park.status === "VISITED").length,
    planned: parks.filter((park) => park.status === "PLANNED").length,
    wishlist: parks.filter((park) => park.status === "WISHLIST").length,
  };
}

export function summarizeParksByCountry(parks: DomainPark[]): CountrySummary[] {
  const byCountry = new Map<string, CountrySummary>();

  for (const park of parks) {
    const summary =
      byCountry.get(park.country) ??
      { country: park.country, total: 0, visited: 0, planned: 0, wishlist: 0 };

    summary.total += 1;
    if (park.status === "VISITED") summary.visited += 1;
    if (park.status === "PLANNED") summary.planned += 1;
    if (park.status === "WISHLIST") summary.wishlist += 1;

    byCountry.set(park.country, summary);
  }

  return [...byCountry.values()].sort(
    (left, right) => right.total - left.total || left.country.localeCompare(right.country),
  );
}

export function topCountry(parks: DomainPark[]): string {
  return summarizeParksByCountry(parks)[0]?.country ?? "—";
}

export function totalLaps(rideLogs: DomainRideLog[]): number {
  return rideLogs
    .filter((log) => log.status === "RIDDEN" && log.lapCount >= 1)
    .reduce((total, log) => total + log.lapCount, 0);
}
