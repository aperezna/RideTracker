import { eq } from "drizzle-orm";

import { db } from "./index";
import { parks, rideLogs, rides, visitDays } from "./schema";
import { transitionParkStatusOnFirstVisit } from "../domain/coaster-stats";
import type { BackupInput } from "../validators/backup.schema";

type ParkRecord = typeof parks.$inferInsert;
type RideRecord = typeof rides.$inferInsert;
type VisitDayRecord = typeof visitDays.$inferInsert;
type RideLogRecord = typeof rideLogs.$inferInsert;

export function importParkRecord(park: ParkRecord, importedRides: RideRecord[]): void {
  db.transaction((transaction) => {
    transaction.insert(parks).values(park).onConflictDoNothing().run();
    for (const ride of importedRides) transaction.insert(rides).values(ride).onConflictDoNothing().run();
  });
}

export function createParkRecord(park: ParkRecord): void {
  db.insert(parks).values(park).run();
}

export function updateParkNotesRecord(parkId: string, tripNotes: string): void {
  db.update(parks).set({ tripNotes }).where(eq(parks.id, parkId)).run();
}

export function updateParkStatusRecord(parkId: string, status: typeof parks.$inferInsert.status): void {
  db.update(parks).set({ status }).where(eq(parks.id, parkId)).run();
}

export function updateVisitDayNotesRecord(visitDayId: string, tripNotes: string): void {
  db.update(visitDays).set({ tripNotes }).where(eq(visitDays.id, visitDayId)).run();
}

export function createRideRecord(ride: RideRecord): void {
  if (!db.select({ id: parks.id }).from(parks).where(eq(parks.id, ride.parkId)).get()) throw new Error("Park not found");
  db.insert(rides).values(ride).run();
}

export function createVisitDayRecord(visit: VisitDayRecord): void {
  db.transaction((transaction) => {
    const park = transaction.select({ status: parks.status }).from(parks).where(eq(parks.id, visit.parkId)).get();
    if (!park) throw new Error("Park not found");
    transaction.insert(visitDays).values(visit).run();
    transaction.update(parks).set({ status: transitionParkStatusOnFirstVisit(park.status) }).where(eq(parks.id, visit.parkId)).run();
  });
}

export function createRideLogRecord(log: RideLogRecord): void {
  const context = db.select({ parkId: visitDays.parkId, rideParkId: rides.parkId })
    .from(visitDays).innerJoin(rides, eq(rides.id, log.rideId)).where(eq(visitDays.id, log.visitDayId)).get();
  if (!context || context.parkId !== context.rideParkId) throw new Error("Ride does not belong to the visit day park");
  db.insert(rideLogs).values(log).run();
}

export function updateRideRatingRecord(rideId: string, rating: number, preferredRow: string | null | undefined, reviewNotes: string | null | undefined): void {
  db.update(rides).set({ rating, preferredRow, reviewNotes }).where(eq(rides.id, rideId)).run();
}

export function exportBackup(): BackupInput {
  return {
    parks: db.select().from(parks).all(),
    rides: db.select().from(rides).all(),
    visitDays: db.select().from(visitDays).all(),
    rideLogs: db.select().from(rideLogs).all(),
  };
}

export function importBackup(backup: BackupInput, toDate: (value: string | number | Date) => Date): void {
  db.transaction((transaction) => {
    transaction.delete(rideLogs).run();
    transaction.delete(visitDays).run();
    transaction.delete(rides).run();
    transaction.delete(parks).run();
    transaction.insert(parks).values(backup.parks.map((park) => ({ ...park, createdAt: toDate(park.createdAt) }))).run();
    transaction.insert(rides).values(backup.rides).run();
    transaction.insert(visitDays).values(backup.visitDays.map((day) => ({ ...day, createdAt: toDate(day.createdAt) }))).run();
    transaction.insert(rideLogs).values(backup.rideLogs).run();
  });
}
