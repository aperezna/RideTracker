import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "./index";
import { categoryEnrichmentJobs, parks, rideLogs, rides, visitDays } from "./schema";
import { transitionParkStatusOnFirstVisit } from "../domain/coaster-stats";
import type { BackupInput } from "../validators/backup.schema";

type ParkRecord = typeof parks.$inferInsert;
type RideRecord = typeof rides.$inferInsert;
type VisitDayRecord = typeof visitDays.$inferInsert;
type RideLogRecord = typeof rideLogs.$inferInsert;

export function importParkRecord(park: ParkRecord, importedRides: RideRecord[]): void {
  db.transaction((transaction) => {
    transaction.insert(parks).values(park).onConflictDoNothing().run();
      for (const ride of importedRides) {
        const updates = {
          name: sql`excluded.name`,
          manufacturer: sql`CASE WHEN excluded.manufacturer <> '' THEN excluded.manufacturer ELSE rides.manufacturer END`,
          ...(ride.category && ride.category !== "UNKNOWN" ? { category: sql`excluded.category` } : {}),
        };
        transaction.insert(rides).values(ride).onConflictDoUpdate({
          target: rides.id,
          set: updates,
        }).run();
     }
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

export function deleteParkRecord(parkId: string): void {
  db.transaction((transaction) => {
    const rideIds = transaction.select({ id: rides.id }).from(rides).where(eq(rides.parkId, parkId)).all().map((ride) => ride.id);
    const visitDayIds = transaction.select({ id: visitDays.id }).from(visitDays).where(eq(visitDays.parkId, parkId)).all().map((visitDay) => visitDay.id);
    if (rideIds.length > 0) transaction.delete(rideLogs).where(inArray(rideLogs.rideId, rideIds)).run();
    if (visitDayIds.length > 0) transaction.delete(rideLogs).where(inArray(rideLogs.visitDayId, visitDayIds)).run();
    transaction.delete(categoryEnrichmentJobs).where(eq(categoryEnrichmentJobs.parkId, parkId)).run();
    transaction.delete(visitDays).where(eq(visitDays.parkId, parkId)).run();
    transaction.delete(rides).where(eq(rides.parkId, parkId)).run();
    transaction.delete(parks).where(eq(parks.id, parkId)).run();
  });
}

export function enqueueRideCategoryJobs(parkId: string, rideIds: string[]): void {
  const now = new Date();
  db.transaction((transaction) => {
    for (const rideId of rideIds) {
      const ride = transaction.select({ category: rides.category, photoUrl: rides.photoUrl, experience: rides.experience, storytelling: rides.storytelling }).from(rides).where(eq(rides.id, rideId)).get();
      if (!ride) continue;
      const existingJob = transaction.select({ status: categoryEnrichmentJobs.status }).from(categoryEnrichmentJobs).where(eq(categoryEnrichmentJobs.id, `category-enrichment-${rideId}`)).get();
      transaction.insert(categoryEnrichmentJobs).values({
        id: `category-enrichment-${rideId}`,
        parkId,
        rideId,
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: now,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing().run();
      if (existingJob?.status === "DONE" && (ride.category === "UNKNOWN" || !ride.photoUrl || !ride.experience || !ride.storytelling)) {
        transaction.update(categoryEnrichmentJobs).set({ status: "PENDING", nextAttemptAt: now, updatedAt: now, lastError: null }).where(eq(categoryEnrichmentJobs.id, `category-enrichment-${rideId}`)).run();
      }
    }
  });
}

export type CategoryEnrichmentJob = {
  id: string;
  parkId: string;
  rideId: string;
  rideName: string;
  parkName: string;
  attempts: number;
};

export function claimNextRideCategoryJob(parkId: string): CategoryEnrichmentJob | null {
  const now = new Date();
  return db.transaction((transaction) => {
    const candidate = transaction.select({
      id: categoryEnrichmentJobs.id,
      parkId: categoryEnrichmentJobs.parkId,
      rideId: categoryEnrichmentJobs.rideId,
      attempts: categoryEnrichmentJobs.attempts,
      rideName: rides.name,
      parkName: parks.name,
    }).from(categoryEnrichmentJobs)
      .innerJoin(rides, eq(rides.id, categoryEnrichmentJobs.rideId))
      .innerJoin(parks, eq(parks.id, categoryEnrichmentJobs.parkId))
      .where(and(
        eq(categoryEnrichmentJobs.parkId, parkId),
        or(eq(categoryEnrichmentJobs.status, "PENDING"), eq(categoryEnrichmentJobs.status, "RETRY")),
        lte(categoryEnrichmentJobs.nextAttemptAt, now),
      ))
      .orderBy(asc(categoryEnrichmentJobs.createdAt))
      .limit(1)
      .get();
    if (!candidate) return null;
    transaction.update(categoryEnrichmentJobs).set({ status: "PROCESSING", updatedAt: now }).where(eq(categoryEnrichmentJobs.id, candidate.id)).run();
    return candidate;
  });
}

export function recoverStaleRideCategoryJobs(parkId: string): void {
  const staleBefore = new Date(Date.now() - 10 * 60_000);
  db.update(categoryEnrichmentJobs).set({ status: "RETRY", nextAttemptAt: new Date(), updatedAt: new Date() }).where(and(
    eq(categoryEnrichmentJobs.parkId, parkId),
    eq(categoryEnrichmentJobs.status, "PROCESSING"),
    lte(categoryEnrichmentJobs.updatedAt, staleBefore),
  )).run();
}

export function recoverAllStaleRideCategoryJobs(): void {
  const staleBefore = new Date(Date.now() - 10 * 60_000);
  const now = new Date();
  db.update(categoryEnrichmentJobs).set({ status: "RETRY", nextAttemptAt: now, updatedAt: now }).where(and(
    eq(categoryEnrichmentJobs.status, "PROCESSING"),
    lte(categoryEnrichmentJobs.updatedAt, staleBefore),
  )).run();
}

export function preparePendingRideEnrichmentJobs(): string[] {
  const now = new Date();
  db.transaction((transaction) => {
    const incompleteJobs = transaction.select({ id: categoryEnrichmentJobs.id })
      .from(categoryEnrichmentJobs)
      .innerJoin(rides, eq(rides.id, categoryEnrichmentJobs.rideId))
      .where(and(
        eq(categoryEnrichmentJobs.status, "DONE"),
        or(eq(rides.category, "UNKNOWN"), isNull(rides.photoUrl), isNull(rides.experience), isNull(rides.storytelling)),
      ))
      .all();
    for (const { id } of incompleteJobs) {
      transaction.update(categoryEnrichmentJobs)
        .set({ status: "PENDING", nextAttemptAt: now, updatedAt: now, lastError: null })
        .where(eq(categoryEnrichmentJobs.id, id))
        .run();
    }
  });
  return db.select({ parkId: categoryEnrichmentJobs.parkId })
    .from(categoryEnrichmentJobs)
    .innerJoin(rides, eq(rides.id, categoryEnrichmentJobs.rideId))
    .where(and(
      inArray(categoryEnrichmentJobs.status, ["PENDING", "RETRY"]),
      or(eq(rides.category, "UNKNOWN"), isNull(rides.photoUrl), isNull(rides.experience), isNull(rides.storytelling)),
    ))
    .groupBy(categoryEnrichmentJobs.parkId)
    .all()
    .map(({ parkId }) => parkId);
}

export function getPendingRideEnrichmentParkIds(): string[] {
  return db.select({ parkId: categoryEnrichmentJobs.parkId })
    .from(categoryEnrichmentJobs)
    .innerJoin(rides, eq(rides.id, categoryEnrichmentJobs.rideId))
    .where(and(
      inArray(categoryEnrichmentJobs.status, ["PENDING", "RETRY"]),
      lte(categoryEnrichmentJobs.nextAttemptAt, new Date()),
      or(eq(rides.category, "UNKNOWN"), isNull(rides.photoUrl), isNull(rides.experience), isNull(rides.storytelling)),
    ))
    .groupBy(categoryEnrichmentJobs.parkId)
    .all()
    .map(({ parkId }) => parkId);
}

export function updateRideCategoryRecord(rideId: string, category: typeof rides.$inferInsert.category): void {
  db.update(rides).set({ category }).where(eq(rides.id, rideId)).run();
}

export function updateRideEnrichmentRecord(rideId: string, category: typeof rides.$inferInsert.category | null, photoUrl: string | null, photoSourceUrl: string | null, experience: string | null, storytelling: string | null): void {
  const updates = {
    ...(category && category !== "UNKNOWN" ? { category } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(photoSourceUrl ? { photoSourceUrl } : {}),
    ...(experience ? { experience } : {}),
    ...(storytelling ? { storytelling } : {}),
  };
  if (Object.keys(updates).length === 0) return;
  db.update(rides).set(updates).where(eq(rides.id, rideId)).run();
}

export function completeRideCategoryJob(jobId: string): void {
  db.update(categoryEnrichmentJobs).set({ status: "DONE", updatedAt: new Date(), lastError: null }).where(eq(categoryEnrichmentJobs.id, jobId)).run();
}

export function retryRideCategoryJob(job: CategoryEnrichmentJob, error: string, maxAttempts: number): void {
  const attempts = job.attempts + 1;
  const status = attempts >= maxAttempts ? "FAILED" : "RETRY";
  const nextAttemptAt = new Date(Date.now() + Math.min(60_000 * 2 ** attempts, 3_600_000));
  db.update(categoryEnrichmentJobs).set({ status, attempts, nextAttemptAt, lastError: error.slice(0, 500), updatedAt: new Date() }).where(eq(categoryEnrichmentJobs.id, job.id)).run();
}

export function updateVisitDayNotesRecord(visitDayId: string, tripNotes: string): void {
  db.update(visitDays).set({ tripNotes }).where(eq(visitDays.id, visitDayId)).run();
}

export function updateVisitDayRecord(visitDayId: string, values: Pick<typeof visitDays.$inferInsert, "visitDate" | "tripNotes" | "durationMinutes" | "weather" | "company" | "overallRating">): void {
  db.update(visitDays).set(values).where(eq(visitDays.id, visitDayId)).run();
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

export function updateRideRatingRecord(rideId: string, rating: number, preferredRow: string | null | undefined, reviewNotes: string | null | undefined): string | undefined {
  db.update(rides).set({ rating, preferredRow, reviewNotes }).where(eq(rides.id, rideId)).run();
  return db.select({ parkId: rides.parkId }).from(rides).where(eq(rides.id, rideId)).get()?.parkId;
}

export function updateRideManufacturerRecord(rideId: string, manufacturer: string): void {
  db.update(rides).set({ manufacturer }).where(eq(rides.id, rideId)).run();
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
    transaction.delete(categoryEnrichmentJobs).run();
    transaction.delete(rides).run();
    transaction.delete(parks).run();
    transaction.insert(parks).values(backup.parks.map((park) => ({ ...park, createdAt: toDate(park.createdAt) }))).run();
    transaction.insert(rides).values(backup.rides).run();
    transaction.insert(visitDays).values(backup.visitDays.map((day) => ({ ...day, createdAt: toDate(day.createdAt) }))).run();
    transaction.insert(rideLogs).values(backup.rideLogs).run();
  });
}
