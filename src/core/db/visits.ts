import { eq } from "drizzle-orm";

import type { VisitDayData } from "../domain/park-views";
import { db } from "./index";
import { parks, rideLogs, rides, visitDays } from "./schema";

export function getVisitDayData(visitDayId: string): VisitDayData | null {
  const visit = db.select().from(visitDays).where(eq(visitDays.id, visitDayId)).get();
  if (!visit) return null;
  const park = db.select().from(parks).where(eq(parks.id, visit.parkId)).get();
  if (!park) return null;
  const rideRows = db.select().from(rides).where(eq(rides.parkId, park.id)).all();
  const logs = db.select().from(rideLogs).where(eq(rideLogs.visitDayId, visitDayId)).all();
  const lapsByRide = new Map<string, number>();
  const checkInsByRide = new Map<string, number>();
  for (const log of logs) {
    lapsByRide.set(log.rideId, (lapsByRide.get(log.rideId) ?? 0) + log.lapCount);
    checkInsByRide.set(log.rideId, (checkInsByRide.get(log.rideId) ?? 0) + 1);
  }
  return {
    id: visit.id,
    parkId: park.id,
    parkName: park.name,
    city: park.city,
    country: park.country,
    visitDate: visit.visitDate,
    tripNotes: visit.tripNotes,
    rides: rideRows.map((ride) => ({
      id: ride.id,
      name: ride.name,
      category: ride.category,
      preferredRow: ride.preferredRow,
      rating: ride.rating,
      lapCount: lapsByRide.get(ride.id) ?? 0,
      checkInCount: checkInsByRide.get(ride.id) ?? 0,
    })),
  };
}
