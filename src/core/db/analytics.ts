import { buildAnalytics, type AnalyticsView } from "@/core/domain/analytics";
import { db } from "@/core/db/index";
import { parks, rideLogs, rides, visitDays, waitTimeObservations } from "@/core/db/schema";

export function getAnalyticsData(): AnalyticsView {
  const parkRows = db.select().from(parks).all();
  const parkNames = new Map(parkRows.map((park) => [park.id, park.name]));
  const rideRows = db.select().from(rides).all();
  const visitRows = db.select().from(visitDays).all();
  const logRows = db.select().from(rideLogs).all();
  const observationRows = db.select().from(waitTimeObservations).all();
  return buildAnalytics(
    visitRows.map((visit) => ({ id: visit.id, parkId: visit.parkId, parkName: parkNames.get(visit.parkId) ?? "Unknown park", visitDate: visit.visitDate, durationMinutes: visit.durationMinutes, overallRating: visit.overallRating })),
    rideRows.map((ride) => ({ id: ride.id, name: ride.name, parkName: parkNames.get(ride.parkId) ?? "Unknown park", category: ride.category, rating: ride.rating, preferredRow: ride.preferredRow })),
    logRows.map((log) => ({ visitDayId: log.visitDayId, rideId: log.rideId, status: log.status, lapCount: log.lapCount })),
    observationRows.map((observation) => ({ rideId: observation.rideId, waitMinutes: observation.waitMinutes, observedAt: observation.observedAt })),
  );
}

export function getAnalyticsExportData() {
  return {
    parks: db.select().from(parks).all(),
    rides: db.select().from(rides).all(),
    visitDays: db.select().from(visitDays).all(),
    rideLogs: db.select().from(rideLogs).all(),
    waitTimeObservations: db.select().from(waitTimeObservations).all(),
    analytics: getAnalyticsData(),
  };
}
