import { buildAnalytics, type AnalyticsView } from "@/core/domain/analytics";
import { eq } from "drizzle-orm";
import { db } from "@/core/db/index";
import { parks, rideLogs, rides, visitDays, waitTimeObservations } from "@/core/db/schema";

export function getAnalyticsData(userId: string): AnalyticsView {
  const parkRows = db.select().from(parks).where(eq(parks.userId, userId)).all();
  const parkNames = new Map(parkRows.map((park) => [park.id, park.name]));
  const rideRows = db.select().from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ rides: ride }) => ride);
  const visitRows = db.select().from(visitDays).innerJoin(parks, eq(parks.id, visitDays.parkId)).where(eq(parks.userId, userId)).all().map(({ visit_days: visit }) => visit);
  const logRows = db.select().from(rideLogs).innerJoin(rides, eq(rides.id, rideLogs.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ ride_logs: log }) => log);
  const observationRows = db.select().from(waitTimeObservations).innerJoin(rides, eq(rides.id, waitTimeObservations.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ wait_time_observations: observation }) => observation);
  return buildAnalytics(
    visitRows.map((visit) => ({ id: visit.id, parkId: visit.parkId, parkName: parkNames.get(visit.parkId) ?? "Unknown park", visitDate: visit.visitDate, durationMinutes: visit.durationMinutes, overallRating: visit.overallRating })),
    rideRows.map((ride) => ({ id: ride.id, name: ride.name, parkName: parkNames.get(ride.parkId) ?? "Unknown park", category: ride.category, rating: ride.rating, preferredRow: ride.preferredRow })),
    logRows.map((log) => ({ visitDayId: log.visitDayId, rideId: log.rideId, status: log.status, lapCount: log.lapCount })),
    observationRows.map((observation) => ({ rideId: observation.rideId, waitMinutes: observation.waitMinutes, observedAt: observation.observedAt })),
  );
}

export function getAnalyticsExportData(userId: string) {
  return {
    parks: db.select().from(parks).where(eq(parks.userId, userId)).all(),
    rides: db.select().from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ rides: ride }) => ride),
    visitDays: db.select().from(visitDays).innerJoin(parks, eq(parks.id, visitDays.parkId)).where(eq(parks.userId, userId)).all().map(({ visit_days: visit }) => visit),
    rideLogs: db.select().from(rideLogs).innerJoin(rides, eq(rides.id, rideLogs.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ ride_logs: log }) => log),
    waitTimeObservations: db.select().from(waitTimeObservations).innerJoin(rides, eq(rides.id, waitTimeObservations.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ wait_time_observations: observation }) => observation),
    analytics: getAnalyticsData(userId),
  };
}
