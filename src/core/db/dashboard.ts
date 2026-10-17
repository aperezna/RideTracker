import {
  calculateTopTen,
  calculateUniqueCoasterCount,
  type DomainRide,
  type DomainRideLog,
} from "../domain/coaster-stats";
import {
  countParksByStatus,
  summarizeParksByCountry,
  topCountry,
  totalLaps as sumLaps,
  type DashboardView,
  type DomainPark,
  type TopRideRow,
} from "../domain/dashboard-stats";
import { db } from "./index";
import { parks, rideLogs, rides } from "./schema";

export function getDashboardData(): DashboardView {
  const parkRows = db.select().from(parks).all();
  const rideRows = db.select().from(rides).all();
  const logRows = db
    .select({ rideId: rideLogs.rideId, status: rideLogs.status, lapCount: rideLogs.lapCount })
    .from(rideLogs)
    .all();

  const domainParks: DomainPark[] = parkRows.map((park) => ({
    id: park.id,
    name: park.name,
    country: park.country,
    latitude: park.latitude,
    longitude: park.longitude,
    status: park.status,
  }));
  const domainRides: DomainRide[] = rideRows.map((ride) => ({
    id: ride.id,
    name: ride.name,
    category: ride.category,
    rating: ride.rating,
  }));
  const domainLogs: DomainRideLog[] = logRows.map((log) => ({
    rideId: log.rideId,
    status: log.status,
    lapCount: log.lapCount,
  }));

  const parkNameById = new Map(parkRows.map((park) => [park.id, park.name]));
  const parkNameByRideId = new Map<string, string>();
  const preferredRowByRideId = new Map<string, string | null>();
  for (const ride of rideRows) {
    parkNameByRideId.set(ride.id, parkNameById.get(ride.parkId) ?? "Unknown park");
    preferredRowByRideId.set(ride.id, ride.preferredRow);
  }

  const ranked = calculateTopTen(domainRides, domainLogs);
  const topRides: TopRideRow[] = ranked.map((ride) => ({
    id: ride.id,
    name: ride.name,
    parkName: parkNameByRideId.get(ride.id) ?? "Unknown park",
    category: ride.category,
    totalLaps: ride.totalLaps,
    rating: ride.rating ?? 0,
    preferredRow: preferredRowByRideId.get(ride.id) ?? null,
  }));

  const counts = countParksByStatus(domainParks);

  return {
    uniqueCoasterCount: calculateUniqueCoasterCount(domainRides, domainLogs),
    visitedParks: counts.visited,
    plannedParks: counts.planned,
    wishlistParks: counts.wishlist,
    totalLaps: sumLaps(domainLogs),
    topCountry: topCountry(domainParks),
    topRides,
    parks: domainParks,
    countries: summarizeParksByCountry(domainParks),
  };
}
