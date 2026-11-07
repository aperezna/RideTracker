import { desc, eq } from "drizzle-orm";

import type { ParkDetailData, ParkCardData, RideDetailData } from "../domain/park-views";
import { db } from "./index";
import { parks, rideLogs, rides, visitDays } from "./schema";

export function getParkCatalogData(): ParkCardData[] {
  const parkRows = db.select().from(parks).orderBy(desc(parks.createdAt)).all();
  const rideCounts = db.select({ parkId: rides.parkId }).from(rides).all();
  const countByPark = new Map<string, number>();
  for (const ride of rideCounts) countByPark.set(ride.parkId, (countByPark.get(ride.parkId) ?? 0) + 1);

  return parkRows.map((park) => ({
    id: park.id,
    name: park.name,
    country: park.country,
    city: park.city,
    status: park.status,
    tripNotes: park.tripNotes,
    rideCount: countByPark.get(park.id) ?? 0,
  }));
}

export function getParkDetailData(parkId: string): ParkDetailData | null {
  const park = db.select().from(parks).where(eq(parks.id, parkId)).get();
  if (!park) return null;

  const rideRows = db.select().from(rides).where(eq(rides.parkId, parkId)).all();
  const visitRows = db.select().from(visitDays).where(eq(visitDays.parkId, parkId)).orderBy(desc(visitDays.visitDate)).all();
  const logs = db.select({ visitDayId: rideLogs.visitDayId, rideId: rideLogs.rideId, lapCount: rideLogs.lapCount })
    .from(rideLogs)
    .all();
  const lapsByRide = new Map<string, number>();
  const tripsByRide = new Map<string, number>();
  const lapsByVisit = new Map<string, number>();
  const ridesByVisit = new Map<string, number>();
  for (const log of logs) {
    lapsByRide.set(log.rideId, (lapsByRide.get(log.rideId) ?? 0) + log.lapCount);
    tripsByRide.set(log.rideId, (tripsByRide.get(log.rideId) ?? 0) + 1);
    lapsByVisit.set(log.visitDayId, (lapsByVisit.get(log.visitDayId) ?? 0) + log.lapCount);
    ridesByVisit.set(log.visitDayId, (ridesByVisit.get(log.visitDayId) ?? 0) + 1);
  }

  return {
    id: park.id,
    name: park.name,
    country: park.country,
    city: park.city,
    status: park.status,
    tripNotes: park.tripNotes,
    rideCount: rideRows.length,
    externalId: park.externalId,
    latitude: park.latitude,
    longitude: park.longitude,
    rides: rideRows.map((ride) => ({
      id: ride.id,
      externalId: ride.externalId,
      name: ride.name,
      category: ride.category,
      manufacturer: ride.manufacturer,
      photoUrl: ride.photoUrl,
      photoSourceUrl: ride.photoSourceUrl,
      rating: ride.rating,
      preferredRow: ride.preferredRow,
      totalLaps: lapsByRide.get(ride.id) ?? 0,
      totalTrips: tripsByRide.get(ride.id) ?? 0,
    })),
    visits: visitRows.map((visit) => ({
      id: visit.id,
      visitDate: visit.visitDate,
      tripNotes: visit.tripNotes,
      durationMinutes: visit.durationMinutes,
      weather: visit.weather,
      company: visit.company,
      overallRating: visit.overallRating,
      totalLaps: lapsByVisit.get(visit.id) ?? 0,
      rideCount: ridesByVisit.get(visit.id) ?? 0,
    })),
  };
}

export function getRideDetailData(parkId: string, rideId: string): RideDetailData | null {
  const park = db.select().from(parks).where(eq(parks.id, parkId)).get();
  const ride = db.select().from(rides).where(eq(rides.id, rideId)).get();
  if (!park || !ride || ride.parkId !== park.id) return null;
  const logs = db.select({ lapCount: rideLogs.lapCount }).from(rideLogs).where(eq(rideLogs.rideId, ride.id)).all();
  return {
    id: ride.id,
    parkId: park.id,
    parkName: park.name,
    parkCountry: park.country,
    parkCity: park.city,
    externalId: ride.externalId,
    name: ride.name,
    category: ride.category,
    manufacturer: ride.manufacturer,
    photoUrl: ride.photoUrl,
    photoSourceUrl: ride.photoSourceUrl,
    rating: ride.rating,
    preferredRow: ride.preferredRow,
    reviewNotes: ride.reviewNotes,
    experience: ride.experience,
    storytelling: ride.storytelling,
    totalTrips: logs.length,
    totalLaps: logs.reduce((sum, log) => sum + log.lapCount, 0),
  };
}
