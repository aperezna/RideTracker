import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/core/db";
import { parks, rideLogs, rides, visitDays } from "@/core/db/schema";

const importRowSchema = z.object({
  park_name: z.string().trim().min(1),
  ride_name: z.string().trim().min(1),
  visit_date: z.string().trim().min(1),
  country: z.string().trim().optional(),
  city: z.string().trim().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  laps: z.coerce.number().int().min(1).default(1),
  status: z.enum(["RIDDEN", "CLOSED"]).default("RIDDEN"),
  rating: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export type ImportPlan = {
  parks: Array<typeof parks.$inferInsert>;
  rides: Array<typeof rides.$inferInsert>;
  visitDays: Array<typeof visitDays.$inferInsert>;
  rideLogs: Array<typeof rideLogs.$inferInsert>;
  duplicates: number;
  warnings: string[];
  errors: string[];
};

export type ImportSummary = {
  parks: number;
  rides: number;
  visitDays: number;
  rideLogs: number;
  duplicates: number;
};

type Database = typeof db;

export function normalizeImportKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stableId(prefix: string, value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `import-${prefix}-${(hash >>> 0).toString(16)}`;
}

export function parseImportRows(value: unknown): ImportRow[] {
  const rows = Array.isArray(value) ? value : (value as { rows?: unknown } | null)?.rows;
  return z.array(importRowSchema).parse(rows);
}

export function parseCsvImport(value: string): ImportRow[] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const next = value[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim() !== "")) records.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  row.push(cell);
  if (row.some((item) => item.trim() !== "")) records.push(row);

  const [header, ...data] = records;
  if (!header) return [];
  const normalizedHeader = header.map((item) => item.trim().toLowerCase());
  return parseImportRows(data.map((values) => Object.fromEntries(normalizedHeader.map((key, index) => [key, values[index] ?? ""]))));
}

export function buildImportPlan(rows: ImportRow[], userId: string, database: Database = db): ImportPlan {
  const ownedParks = database.select().from(parks).where(eq(parks.userId, userId)).all();
  const ownedRides = database.select().from(rides).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ rides: ride }) => ride);
  const ownedVisits = database.select().from(visitDays).innerJoin(parks, eq(parks.id, visitDays.parkId)).where(eq(parks.userId, userId)).all().map(({ visit_days: visit }) => visit);
  const ownedLogs = database.select().from(rideLogs).innerJoin(rides, eq(rides.id, rideLogs.rideId)).innerJoin(parks, eq(parks.id, rides.parkId)).where(eq(parks.userId, userId)).all().map(({ ride_logs: log }) => log);

  const plannedParks = new Map<string, typeof parks.$inferInsert>(ownedParks.map((park) => [`${normalizeImportKey(park.name)}|${normalizeImportKey(park.country)}`, park]));
  const parksByName = new Map<string, Array<typeof parks.$inferInsert>>();
  for (const park of ownedParks) parksByName.set(normalizeImportKey(park.name), [...(parksByName.get(normalizeImportKey(park.name)) ?? []), park]);
  const plannedRides = new Map<string, typeof rides.$inferInsert>(ownedRides.map((ride) => [`${ride.parkId}|${normalizeImportKey(ride.name)}`, ride]));
  const plannedVisits = new Map<string, typeof visitDays.$inferInsert>(ownedVisits.map((visit) => [`${visit.parkId}|${visit.visitDate}`, visit]));
  const plannedLogs = new Set(ownedLogs.map((log) => `${log.visitDayId}|${log.rideId}|${log.status}|${log.lapCount}`));
  const plan: ImportPlan = { parks: [], rides: [], visitDays: [], rideLogs: [], duplicates: 0, warnings: [], errors: [] };

  for (const [index, row] of rows.entries()) {
    const parkKey = `${normalizeImportKey(row.park_name)}|${normalizeImportKey(row.country ?? "")}`;
    let park = plannedParks.get(parkKey);
    if (!park && !row.country) {
      const sameNameParks = parksByName.get(normalizeImportKey(row.park_name)) ?? [];
      if (sameNameParks.length === 1) park = sameNameParks[0];
      if (sameNameParks.length > 1) {
        plan.errors.push(`Row ${index + 2}: country is required because multiple parks have this name.`);
        continue;
      }
    }
    if (!park) {
      if (row.latitude === undefined || row.longitude === undefined || !row.country || !row.city) {
        plan.errors.push(`Row ${index + 2}: a new park requires country, city, latitude, and longitude.`);
        continue;
      }
      park = {
        id: stableId("park", `${userId}|${parkKey}`), userId, externalId: null, name: row.park_name, country: row.country,
        city: row.city, latitude: row.latitude, longitude: row.longitude, status: "VISITED", tripNotes: "", createdAt: new Date(),
      };
      plannedParks.set(parkKey, park);
      parksByName.set(normalizeImportKey(park.name), [...(parksByName.get(normalizeImportKey(park.name)) ?? []), park]);
      plan.parks.push(park);
    }

    const rideKey = `${park.id}|${normalizeImportKey(row.ride_name)}`;
    let ride: typeof rides.$inferInsert;
    const existingRide = plannedRides.get(rideKey);
    if (existingRide) {
      ride = existingRide;
      if (row.rating !== undefined && ride.rating !== null) plan.warnings.push(`Row ${index + 2}: existing ride rating was not overwritten.`);
    } else {
      ride = { id: stableId("ride", `${park.id}|${normalizeImportKey(row.ride_name)}`), parkId: park.id, externalId: null, name: row.ride_name, category: "UNKNOWN", manufacturer: "", rating: row.rating ?? null };
      plannedRides.set(rideKey, ride);
      plan.rides.push(ride);
    }

    const visitKey = `${park.id}|${row.visit_date}`;
    let visit = plannedVisits.get(visitKey);
    if (!visit) {
      const parsedDate = new Date(row.visit_date);
      if (Number.isNaN(parsedDate.getTime())) {
        plan.errors.push(`Row ${index + 2}: invalid visit_date.`);
        continue;
      }
      visit = { id: stableId("visit", visitKey), parkId: park.id, visitDate: row.visit_date, tripNotes: null, durationMinutes: null, weather: null, company: null, overallRating: null, createdAt: parsedDate };
      plannedVisits.set(visitKey, visit);
      plan.visitDays.push(visit);
    }

    const logKey = `${visit.id}|${ride.id}|${row.status}|${row.laps}`;
    if (plannedLogs.has(logKey)) {
      plan.duplicates += 1;
      continue;
    }
    plannedLogs.add(logKey);
    plan.rideLogs.push({ id: stableId("log", logKey), visitDayId: visit.id, rideId: ride.id, status: row.status, lapCount: row.laps, rowUsed: null, notes: row.notes ?? null });
  }
  return plan;
}

export function summarizeImportPlan(plan: ImportPlan): ImportSummary {
  return { parks: plan.parks.length, rides: plan.rides.length, visitDays: plan.visitDays.length, rideLogs: plan.rideLogs.length, duplicates: plan.duplicates };
}

export function applyImportPlan(plan: ImportPlan, database: Database = db): ImportSummary {
  if (plan.errors.length > 0) throw new Error("Import contains validation errors");
  database.transaction((transaction) => {
    for (const park of plan.parks) transaction.insert(parks).values(park).onConflictDoNothing().run();
    for (const ride of plan.rides) transaction.insert(rides).values(ride).onConflictDoNothing().run();
    for (const visit of plan.visitDays) transaction.insert(visitDays).values(visit).onConflictDoNothing().run();
    for (const log of plan.rideLogs) transaction.insert(rideLogs).values(log).onConflictDoNothing().run();
  });
  return summarizeImportPlan(plan);
}
