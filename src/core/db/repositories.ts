import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "./index";
import { categoryEnrichmentJobs, enrichmentSourceFailures, parks, parkOfficialLinks, rideAliases, rideFieldSources, rideLogs, rides, users, visitDays, waitTimeObservations } from "./schema";
import { transitionParkStatusOnFirstVisit } from "../domain/coaster-stats";
import type { BackupInput } from "../validators/backup.schema";

type ParkRecord = typeof parks.$inferInsert;
type RideRecord = typeof rides.$inferInsert;
type VisitDayRecord = typeof visitDays.$inferInsert;
type RideLogRecord = typeof rideLogs.$inferInsert;
type WaitTimeObservationRecord = typeof waitTimeObservations.$inferInsert;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, normalizeEmail(email))).get();
}

export function createUserRecord(email: string, passwordHash: string): string {
  const id = crypto.randomUUID();
  const normalizedEmail = normalizeEmail(email);
  db.transaction((transaction) => {
    const existingUsers = transaction.select({ id: users.id }).from(users).all();
    transaction.insert(users).values({ id, email: normalizedEmail, passwordHash, createdAt: new Date() }).run();
    if (existingUsers.length === 0) transaction.update(parks).set({ userId: id }).where(isNull(parks.userId)).run();
  });
  return id;
}

export function getUserById(userId: string) {
  return db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).get();
}

export function importParkRecord(park: ParkRecord, importedRides: RideRecord[], userId: string): void {
  db.transaction((transaction) => {
    transaction.insert(parks).values({ ...park, userId }).onConflictDoNothing().run();
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

export function createParkRecord(park: ParkRecord, userId: string): void {
  db.insert(parks).values({ ...park, userId }).run();
}

export function updateParkNotesRecord(parkId: string, userId: string, tripNotes: string): void {
  db.update(parks).set({ tripNotes }).where(and(eq(parks.id, parkId), eq(parks.userId, userId))).run();
}

export function updateParkStatusRecord(parkId: string, userId: string, status: typeof parks.$inferInsert.status): void {
  db.update(parks).set({ status }).where(and(eq(parks.id, parkId), eq(parks.userId, userId))).run();
}

export function deleteParkRecord(parkId: string, userId: string, database: typeof db = db): void {
  database.transaction((transaction) => {
    if (!transaction.select({ id: parks.id }).from(parks).where(and(eq(parks.id, parkId), eq(parks.userId, userId))).get()) return;
    const rideIds = transaction.select({ id: rides.id }).from(rides).where(eq(rides.parkId, parkId)).all().map((ride) => ride.id);
    const visitDayIds = transaction.select({ id: visitDays.id }).from(visitDays).where(eq(visitDays.parkId, parkId)).all().map((visitDay) => visitDay.id);
    if (rideIds.length > 0) transaction.delete(rideLogs).where(inArray(rideLogs.rideId, rideIds)).run();
    if (visitDayIds.length > 0) transaction.delete(rideLogs).where(inArray(rideLogs.visitDayId, visitDayIds)).run();
    if (rideIds.length > 0) {
      transaction.delete(waitTimeObservations).where(inArray(waitTimeObservations.rideId, rideIds)).run();
      transaction.delete(rideFieldSources).where(inArray(rideFieldSources.rideId, rideIds)).run();
      transaction.delete(rideAliases).where(inArray(rideAliases.rideId, rideIds)).run();
      transaction.delete(enrichmentSourceFailures).where(inArray(enrichmentSourceFailures.scopeKey, rideIds)).run();
    }
    transaction.delete(categoryEnrichmentJobs).where(eq(categoryEnrichmentJobs.parkId, parkId)).run();
    transaction.delete(parkOfficialLinks).where(eq(parkOfficialLinks.parkId, parkId)).run();
    transaction.delete(visitDays).where(eq(visitDays.parkId, parkId)).run();
    transaction.delete(rides).where(eq(rides.parkId, parkId)).run();
    transaction.delete(parks).where(eq(parks.id, parkId)).run();
  });
}

export function enqueueRideCategoryJobs(parkId: string, rideIds: string[], userId: string): void {
  const now = new Date();
  db.transaction((transaction) => {
    if (!transaction.select({ id: parks.id }).from(parks).where(and(eq(parks.id, parkId), eq(parks.userId, userId))).get()) return;
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
  const control = db.select({ categoryManual: rides.categoryManual, manufacturerManual: rides.manufacturerManual, experienceManual: rides.experienceManual, storytellingManual: rides.storytellingManual, photoManual: rides.photoManual })
    .from(rides).where(eq(rides.id, rideId)).get();
  if (!control) return;
  const updates = {
    ...(!control.categoryManual && category && category !== "UNKNOWN" ? { category } : {}),
    ...(!control.photoManual && photoUrl ? { photoUrl } : {}),
    ...(!control.photoManual && photoSourceUrl ? { photoSourceUrl } : {}),
    ...(!control.experienceManual && experience ? { experience } : {}),
    ...(!control.storytellingManual && storytelling ? { storytelling } : {}),
  };
  if (Object.keys(updates).length === 0) return;
  db.update(rides).set(updates).where(eq(rides.id, rideId)).run();
}

export type ManualRideFields = Partial<Pick<typeof rides.$inferInsert, "category" | "manufacturer" | "experience" | "storytelling">>;

export function updateRideManualFields(rideId: string, userId: string, fields: ManualRideFields): string | undefined {
  const updates = {
    ...(fields.category !== undefined ? { category: fields.category, categoryManual: true } : {}),
    ...(fields.manufacturer !== undefined ? { manufacturer: fields.manufacturer, manufacturerManual: true } : {}),
    ...(fields.experience !== undefined ? { experience: fields.experience, experienceManual: true } : {}),
    ...(fields.storytelling !== undefined ? { storytelling: fields.storytelling, storytellingManual: true } : {}),
  };
  if (Object.keys(updates).length === 0) return undefined;
  const ride = db.select({ parkId: rides.parkId }).from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(and(eq(rides.id, rideId), eq(parks.userId, userId))).get();
  if (!ride) return undefined;
  db.update(rides).set(updates).where(eq(rides.id, rideId)).run();
  return ride.parkId;
}

export function recordRideFieldSources(rideId: string, sources: Array<{ field: string; source: string; sourceUrl?: string | null }>): void {
  db.transaction((transaction) => {
    for (const source of sources) {
      transaction.delete(rideFieldSources).where(and(eq(rideFieldSources.rideId, rideId), eq(rideFieldSources.field, source.field))).run();
      transaction.insert(rideFieldSources).values({ id: crypto.randomUUID(), rideId, field: source.field, source: source.source, sourceUrl: source.sourceUrl ?? null, observedAt: new Date() }).run();
    }
  });
}

export function isEnrichmentCoolingDown(source: string, scopeKey: string, now = new Date()): boolean {
  const failure = db.select({ retryAfter: enrichmentSourceFailures.retryAfter }).from(enrichmentSourceFailures)
    .where(and(eq(enrichmentSourceFailures.source, source), eq(enrichmentSourceFailures.scopeKey, scopeKey))).get();
  return Boolean(failure && failure.retryAfter > now);
}

export function recordEnrichmentFailure(source: string, scopeKey: string, error: string): void {
  const id = `${source}:${scopeKey}`;
  const previous = db.select().from(enrichmentSourceFailures).where(eq(enrichmentSourceFailures.id, id)).get();
  const attempts = (previous?.attempts ?? 0) + 1;
  const now = new Date();
  const retryAfter = new Date(now.getTime() + Math.min(60_000 * 2 ** Math.min(attempts, 5), 3_600_000));
  db.insert(enrichmentSourceFailures).values({ id, source, scopeKey, attempts, lastError: error.slice(0, 500), retryAfter, updatedAt: now })
    .onConflictDoUpdate({ target: enrichmentSourceFailures.id, set: { attempts, lastError: error.slice(0, 500), retryAfter, updatedAt: now } }).run();
}

export function clearEnrichmentFailure(source: string, scopeKey: string): void {
  db.delete(enrichmentSourceFailures).where(and(eq(enrichmentSourceFailures.source, source), eq(enrichmentSourceFailures.scopeKey, scopeKey))).run();
}

export function addRideAlias(rideId: string, alias: string, source: string | null = null, verified = false): void {
  const normalized = alias.trim();
  if (!normalized) throw new Error("Alias is required");
  db.insert(rideAliases).values({ id: crypto.randomUUID(), rideId, alias: normalized, source, verified }).run();
}

export function addVerifiedParkOfficialLink(parkId: string, label: string, url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Official links must use HTTPS");
  db.insert(parkOfficialLinks).values({ id: crypto.randomUUID(), parkId, label: label.trim(), url: parsed.toString(), verifiedAt: new Date() }).run();
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

export function updateVisitDayNotesRecord(visitDayId: string, userId: string, tripNotes: string): void {
  db.update(visitDays).set({ tripNotes }).where(and(eq(visitDays.id, visitDayId), sql`EXISTS (SELECT 1 FROM parks WHERE parks.id = ${visitDays.parkId} AND parks.user_id = ${userId})`)).run();
}

export function updateVisitDayRecord(visitDayId: string, userId: string, values: Pick<typeof visitDays.$inferInsert, "visitDate" | "tripNotes" | "durationMinutes" | "weather" | "company" | "overallRating">): void {
  db.update(visitDays).set(values).where(and(eq(visitDays.id, visitDayId), sql`EXISTS (SELECT 1 FROM parks WHERE parks.id = ${visitDays.parkId} AND parks.user_id = ${userId})`)).run();
}

export function createRideRecord(ride: RideRecord, userId: string): void {
  if (!db.select({ id: parks.id }).from(parks).where(and(eq(parks.id, ride.parkId), eq(parks.userId, userId))).get()) throw new Error("Park not found");
  db.insert(rides).values(ride).run();
}

export function createVisitDayRecord(visit: VisitDayRecord, userId: string): void {
  db.transaction((transaction) => {
    const park = transaction.select({ status: parks.status }).from(parks).where(and(eq(parks.id, visit.parkId), eq(parks.userId, userId))).get();
    if (!park) throw new Error("Park not found");
    transaction.insert(visitDays).values(visit).run();
    transaction.update(parks).set({ status: transitionParkStatusOnFirstVisit(park.status) }).where(eq(parks.id, visit.parkId)).run();
  });
}

export function createRideLogRecord(log: RideLogRecord, userId: string): void {
  const context = db.select({ parkId: visitDays.parkId, rideParkId: rides.parkId })
    .from(visitDays).innerJoin(rides, eq(rides.id, log.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(and(eq(visitDays.id, log.visitDayId), eq(parks.userId, userId))).get();
  if (!context || context.parkId !== context.rideParkId) throw new Error("Ride does not belong to the visit day park");
  db.insert(rideLogs).values(log).onConflictDoNothing().run();
}

export type WaitTimeSnapshot = Pick<WaitTimeObservationRecord, "rideId" | "source" | "waitMinutes" | "isOpen">;

export function recordWaitTimeSnapshots(snapshots: WaitTimeSnapshot[], userId: string, observedAt = new Date()): void {
  const recentThreshold = new Date(observedAt.getTime() - 5 * 60_000);
  db.transaction((transaction) => {
    for (const snapshot of snapshots) {
      const ownedRide = transaction.select({ id: rides.id }).from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(and(eq(rides.id, snapshot.rideId), eq(parks.userId, userId))).get();
      if (!ownedRide) continue;
      const recent = transaction.select({ id: waitTimeObservations.id })
        .from(waitTimeObservations)
        .where(and(
          eq(waitTimeObservations.rideId, snapshot.rideId),
          eq(waitTimeObservations.source, snapshot.source),
          gt(waitTimeObservations.observedAt, recentThreshold),
        ))
        .limit(1)
        .get();
      if (recent) continue;
      transaction.insert(waitTimeObservations).values({ id: crypto.randomUUID(), ...snapshot, observedAt }).run();
    }
  });
}

export function updateRideRatingRecord(rideId: string, userId: string, rating: number, preferredRow: string | null | undefined, reviewNotes: string | null | undefined): string | undefined {
  const ride = db.select({ parkId: rides.parkId }).from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(and(eq(rides.id, rideId), eq(parks.userId, userId))).get();
  if (!ride) return undefined;
  db.update(rides).set({ rating, preferredRow, reviewNotes }).where(eq(rides.id, rideId)).run();
  return ride.parkId;
}

export function updateRideManufacturerRecord(rideId: string, userId: string, manufacturer: string): void {
  const ride = db.select({ id: rides.id }).from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(and(eq(rides.id, rideId), eq(parks.userId, userId))).get();
  if (ride) db.update(rides).set({ manufacturer }).where(eq(rides.id, rideId)).run();
}

export function exportBackup(userId: string): BackupInput {
  const ownedParkIds = db.select({ id: parks.id }).from(parks).where(eq(parks.userId, userId)).all().map(({ id }) => id);
  const ownedRideIds = ownedParkIds.length === 0 ? [] : db.select({ id: rides.id }).from(rides).where(inArray(rides.parkId, ownedParkIds)).all().map(({ id }) => id);
  return {
    parks: db.select().from(parks).where(eq(parks.userId, userId)).all(),
    rides: db.select().from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ rides: ride }) => ride),
    visitDays: db.select().from(visitDays).innerJoin(parks, eq(parks.id, visitDays.parkId)).where(eq(parks.userId, userId)).all().map(({ visit_days: visit }) => visit),
    rideLogs: ownedRideIds.length === 0 ? [] : db.select().from(rideLogs).where(inArray(rideLogs.rideId, ownedRideIds)).all(),
    waitTimeObservations: ownedRideIds.length === 0 ? [] : db.select().from(waitTimeObservations).where(inArray(waitTimeObservations.rideId, ownedRideIds)).all(),
  };
}

export function importBackup(backup: BackupInput, userId: string, toDate: (value: string | number | Date) => Date): void {
  db.transaction((transaction) => {
    const ownedParkIds = transaction.select({ id: parks.id }).from(parks).where(eq(parks.userId, userId)).all().map(({ id }) => id);
    const ownedRideIds = ownedParkIds.length === 0 ? [] : transaction.select({ id: rides.id }).from(rides).where(inArray(rides.parkId, ownedParkIds)).all().map(({ id }) => id);
    const ownedVisitIds = ownedParkIds.length === 0 ? [] : transaction.select({ id: visitDays.id }).from(visitDays).where(inArray(visitDays.parkId, ownedParkIds)).all().map(({ id }) => id);
    if (ownedRideIds.length > 0) {
      transaction.delete(rideLogs).where(inArray(rideLogs.rideId, ownedRideIds)).run();
      transaction.delete(waitTimeObservations).where(inArray(waitTimeObservations.rideId, ownedRideIds)).run();
    }
    if (ownedVisitIds.length > 0) transaction.delete(rideLogs).where(inArray(rideLogs.visitDayId, ownedVisitIds)).run();
    if (ownedParkIds.length > 0) {
      transaction.delete(visitDays).where(inArray(visitDays.id, ownedVisitIds)).run();
      transaction.delete(categoryEnrichmentJobs).where(inArray(categoryEnrichmentJobs.parkId, ownedParkIds)).run();
      transaction.delete(parkOfficialLinks).where(inArray(parkOfficialLinks.parkId, ownedParkIds)).run();
      if (ownedRideIds.length > 0) {
        transaction.delete(rideFieldSources).where(inArray(rideFieldSources.rideId, ownedRideIds)).run();
        transaction.delete(rideAliases).where(inArray(rideAliases.rideId, ownedRideIds)).run();
        transaction.delete(enrichmentSourceFailures).where(inArray(enrichmentSourceFailures.scopeKey, ownedRideIds)).run();
      }
      transaction.delete(rides).where(inArray(rides.parkId, ownedParkIds)).run();
      transaction.delete(parks).where(inArray(parks.id, ownedParkIds)).run();
    }
    transaction.insert(parks).values(backup.parks.map((park) => ({ ...park, userId, createdAt: toDate(park.createdAt) }))).run();
    transaction.insert(rides).values(backup.rides).run();
    transaction.insert(visitDays).values(backup.visitDays.map((day) => ({ ...day, durationMinutes: day.durationMinutes ?? null, weather: day.weather ?? null, company: day.company ?? null, overallRating: day.overallRating ?? null, createdAt: toDate(day.createdAt) }))).run();
    transaction.insert(rideLogs).values(backup.rideLogs).run();
    if (backup.waitTimeObservations) transaction.insert(waitTimeObservations).values(backup.waitTimeObservations.map((observation) => ({ ...observation, observedAt: toDate(observation.observedAt) }))).run();
  });
}
