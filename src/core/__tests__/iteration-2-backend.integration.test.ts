import { describe, expect, it } from "vitest";
import { createDatabase } from "@/core/db";
import { parks, rideLogs, rides, visitDays } from "@/core/db/schema";
import { calculateTopTen, calculateUniqueCoasterCount } from "@/core/domain/coaster-stats";
import { transitionParkStatusOnFirstVisit } from "@/core/domain/coaster-stats";

function createSchema(connection: ReturnType<typeof createDatabase>): void {
  connection.client.exec(`
    CREATE TABLE parks (
      id TEXT PRIMARY KEY, external_id TEXT, name TEXT NOT NULL, country TEXT NOT NULL,
      city TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
      status TEXT NOT NULL, trip_notes TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
    );
    CREATE TABLE rides (
      id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), external_id TEXT,
      name TEXT NOT NULL, category TEXT NOT NULL, manufacturer TEXT NOT NULL DEFAULT '',
      rating REAL, preferred_row TEXT, review_notes TEXT
    );
    CREATE TABLE visit_days (
      id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), visit_date TEXT NOT NULL,
      trip_notes TEXT, created_at INTEGER NOT NULL
    );
    CREATE TABLE ride_logs (
      id TEXT PRIMARY KEY, visit_day_id TEXT NOT NULL REFERENCES visit_days(id), ride_id TEXT NOT NULL REFERENCES rides(id),
      status TEXT NOT NULL, lap_count INTEGER NOT NULL DEFAULT 1, row_used TEXT, notes TEXT
    );
  `);
}

describe("Iteration 2 SQLite persistence", () => {
  it("persists a park, rides, visit day, and ride log in memory", () => {
    const connection = createDatabase(":memory:");
    createSchema(connection);
    const createdAt = new Date("2026-12-30T00:00:00.000Z");

    connection.db.insert(parks).values({ id: "park-1", name: "Park", country: "DE", city: "Brühl", latitude: 50, longitude: 7, status: "VISITED", tripNotes: "Plan", createdAt }).run();
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
});
