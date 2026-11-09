import { describe, expect, it } from "vitest";
import { createDatabase } from "@/core/db";
import { deleteParkRecord } from "@/core/db/repositories";
import { parks, rideAliases, rideFieldSources, rideLogs, rides, users, visitDays, waitTimeObservations } from "@/core/db/schema";
import { calculateTopTen, calculateUniqueCoasterCount } from "@/core/domain/coaster-stats";
import { transitionParkStatusOnFirstVisit } from "@/core/domain/coaster-stats";
import { getParkCatalogData } from "@/core/db/parks";

function createSchema(connection: ReturnType<typeof createDatabase>): void {
  connection.client.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE parks (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), external_id TEXT, name TEXT NOT NULL, country TEXT NOT NULL,
      city TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
      status TEXT NOT NULL, trip_notes TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
    );
    CREATE TABLE rides (
      id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), external_id TEXT,
       name TEXT NOT NULL, category TEXT NOT NULL, manufacturer TEXT NOT NULL DEFAULT '', photo_url TEXT, photo_source_url TEXT,
       experience TEXT, storytelling TEXT,
       rating REAL, preferred_row TEXT, review_notes TEXT,
       category_manual INTEGER NOT NULL DEFAULT 0, manufacturer_manual INTEGER NOT NULL DEFAULT 0,
       experience_manual INTEGER NOT NULL DEFAULT 0, storytelling_manual INTEGER NOT NULL DEFAULT 0,
       photo_manual INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE visit_days (
      id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), visit_date TEXT NOT NULL,
       trip_notes TEXT, duration_minutes INTEGER, weather TEXT, company TEXT, overall_rating REAL, created_at INTEGER NOT NULL
    );
    CREATE TABLE ride_logs (
      id TEXT PRIMARY KEY, visit_day_id TEXT NOT NULL REFERENCES visit_days(id), ride_id TEXT NOT NULL REFERENCES rides(id),
      status TEXT NOT NULL, lap_count INTEGER NOT NULL DEFAULT 1, row_used TEXT, notes TEXT
    );
    CREATE TABLE wait_time_observations (id TEXT PRIMARY KEY, ride_id TEXT NOT NULL REFERENCES rides(id), source TEXT NOT NULL, wait_minutes INTEGER, is_open INTEGER, observed_at INTEGER NOT NULL);
    CREATE TABLE ride_field_sources (id TEXT PRIMARY KEY, ride_id TEXT NOT NULL REFERENCES rides(id), field TEXT NOT NULL, source TEXT NOT NULL, source_url TEXT, observed_at INTEGER NOT NULL);
    CREATE TABLE ride_aliases (id TEXT PRIMARY KEY, ride_id TEXT NOT NULL REFERENCES rides(id), alias TEXT NOT NULL, source TEXT, verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE enrichment_source_failures (id TEXT PRIMARY KEY, source TEXT NOT NULL, scope_key TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, retry_after INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE park_official_links (id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), label TEXT NOT NULL, url TEXT NOT NULL, verified_at INTEGER NOT NULL);
    CREATE TABLE category_enrichment_jobs (id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), ride_id TEXT NOT NULL REFERENCES rides(id), status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL, last_error TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  `);
}

describe("Iteration 2 SQLite persistence", () => {
  it("persists a park, rides, visit day, and ride log in memory", () => {
    const connection = createDatabase(":memory:");
    createSchema(connection);
    const createdAt = new Date("2026-12-30T00:00:00.000Z");

    connection.db.insert(users).values({ id: "user-1", email: "one@example.com", passwordHash: "hash", createdAt }).run();
    connection.db.insert(parks).values({ id: "park-1", userId: "user-1", name: "Park", country: "DE", city: "Brühl", latitude: 50, longitude: 7, status: "VISITED", tripNotes: "Plan", createdAt }).run();
    connection.db.insert(rides).values({ id: "ride-1", parkId: "park-1", name: "Coaster", category: "COASTER", manufacturer: "Maker", rating: 9, preferredRow: "FRONT" }).run();
    connection.db.insert(visitDays).values({ id: "day-1", parkId: "park-1", visitDate: "2026-12-30", tripNotes: "Cold", createdAt }).run();
    connection.db.insert(rideLogs).values({ id: "log-1", visitDayId: "day-1", rideId: "ride-1", status: "RIDDEN", lapCount: 2, rowUsed: "FRONT" }).run();

    expect(connection.db.select().from(parks).all()).toHaveLength(1);
    expect(connection.db.select().from(rides).all()[0]?.preferredRow).toBe("FRONT");
    expect(connection.db.select().from(visitDays).all()[0]?.tripNotes).toBe("Cold");
    expect(connection.db.select().from(rideLogs).all()[0]?.lapCount).toBe(2);
    connection.client.close();
  });

  it("feeds persisted logs into unique coaster and Top 10 calculations", () => {
    const connection = createDatabase(":memory:");
    createSchema(connection);
    const ride = { id: "ride-1", name: "Coaster", category: "COASTER" as const, rating: 9 };
    const logs = [{ rideId: "ride-1", status: "RIDDEN" as const, lapCount: 2 }];
    expect(calculateUniqueCoasterCount([ride], logs)).toBe(1);
    expect(calculateTopTen([ride], logs)[0]?.totalLaps).toBe(2);
    connection.client.close();
  });

  it("transitions a planned park to VISITED on its first visit", () => {
    expect(transitionParkStatusOnFirstVisit("PLANNED")).toBe("VISITED");
  });

  it("deletes a park and every dependent catalog record", () => {
    const connection = createDatabase(":memory:");
    createSchema(connection);
    const createdAt = new Date("2026-12-30T00:00:00.000Z");
    connection.db.insert(users).values({ id: "user-1", email: "one@example.com", passwordHash: "hash", createdAt }).run();
    connection.db.insert(parks).values({ id: "park-1", userId: "user-1", name: "Park", country: "DE", city: "Brühl", latitude: 50, longitude: 7, status: "VISITED", createdAt }).run();
    connection.db.insert(rides).values({ id: "ride-1", parkId: "park-1", name: "Coaster", category: "COASTER" }).run();
    connection.db.insert(visitDays).values({ id: "day-1", parkId: "park-1", visitDate: "2026-12-30", createdAt }).run();
    connection.db.insert(rideLogs).values({ id: "log-1", visitDayId: "day-1", rideId: "ride-1", status: "RIDDEN" }).run();
    connection.db.insert(waitTimeObservations).values({ id: "wait-1", rideId: "ride-1", source: "test", observedAt: createdAt }).run();
    connection.db.insert(rideFieldSources).values({ id: "source-1", rideId: "ride-1", field: "category", source: "test", observedAt: createdAt }).run();
    connection.db.insert(rideAliases).values({ id: "alias-1", rideId: "ride-1", alias: "Coaster alias" }).run();
    deleteParkRecord("park-1", "user-1", connection.db);
    expect(connection.db.select().from(parks).all()).toHaveLength(0);
    expect(connection.db.select().from(rides).all()).toHaveLength(0);
    expect(connection.db.select().from(rideLogs).all()).toHaveLength(0);
    expect(connection.db.select().from(waitTimeObservations).all()).toHaveLength(0);
    expect(connection.db.select().from(rideFieldSources).all()).toHaveLength(0);
    expect(connection.db.select().from(rideAliases).all()).toHaveLength(0);
    connection.client.close();
  });

  it("returns only the requesting user's parks", () => {
    const connection = createDatabase(":memory:");
    createSchema(connection);
    const createdAt = new Date("2026-12-30T00:00:00.000Z");
    connection.db.insert(users).values([
      { id: "user-1", email: "one@example.com", passwordHash: "hash", createdAt },
      { id: "user-2", email: "two@example.com", passwordHash: "hash", createdAt },
    ]).run();
    connection.db.insert(parks).values([
      { id: "park-1", userId: "user-1", name: "Private One", country: "DE", city: "Brühl", latitude: 50, longitude: 7, status: "VISITED", createdAt },
      { id: "park-2", userId: "user-2", name: "Private Two", country: "US", city: "Orlando", latitude: 28, longitude: -81, status: "PLANNED", createdAt },
    ]).run();
    expect(getParkCatalogData("user-1", connection.db).map((park) => park.name)).toEqual(["Private One"]);
    connection.client.close();
  });

});
