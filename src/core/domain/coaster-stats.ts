import type { ParkStatus, RideCategory, RideLogStatus } from "../db/schema";

export type DomainRide = {
  id: string;
  name: string;
  category: RideCategory;
  rating: number | null;
};

export type DomainRideLog = {
  rideId: string;
  status: RideLogStatus;
  lapCount: number;
};

export type RankedRide = DomainRide & { totalLaps: number };

export function calculateUniqueCoasterCount(rides: DomainRide[], rideLogs: DomainRideLog[]): number {
  const coasterIds = new Set(rides.filter((ride) => ride.category === "COASTER").map((ride) => ride.id));
  return new Set(
    rideLogs
      .filter((log) => log.status === "RIDDEN" && log.lapCount >= 1 && coasterIds.has(log.rideId))
      .map((log) => log.rideId),
  ).size;
}

export function calculateTopTen(rides: DomainRide[], rideLogs: DomainRideLog[]): RankedRide[] {
  const lapsByRide = new Map<string, number>();
  for (const log of rideLogs) {
    if (log.status === "RIDDEN" && log.lapCount >= 1) {
      lapsByRide.set(log.rideId, (lapsByRide.get(log.rideId) ?? 0) + log.lapCount);
    }
  }

  return rides
    .filter((ride) => ride.rating !== null && (lapsByRide.get(ride.id) ?? 0) > 0)
    .map((ride) => ({ ...ride, totalLaps: lapsByRide.get(ride.id) ?? 0 }))
    .sort((left, right) =>
      (right.rating ?? 0) - (left.rating ?? 0) ||
      right.totalLaps - left.totalLaps ||
      left.name.localeCompare(right.name),
    )
    .slice(0, 10);
}

export function transitionParkStatusOnFirstVisit(status: ParkStatus): ParkStatus {
  return status === "WISHLIST" || status === "PLANNED" ? "VISITED" : status;
}
