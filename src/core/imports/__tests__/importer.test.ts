import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/core/db";
import { parks, rideLogs, rides, users, visitDays } from "@/core/db/schema";
import { applyImportPlan, buildImportPlan, parseCsvImport, summarizeImportPlan } from "../importer";

const connections: Array<ReturnType<typeof createDatabase>> = [];

afterEach(() => {
  for (const connection of connections.splice(0)) connection.client.close();
});

function createSchema(connection: ReturnType<typeof createDatabase>): void {
  connection.client.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE parks (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), external_id TEXT, name TEXT NOT NULL, country TEXT NOT NULL, city TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, status TEXT NOT NULL, trip_notes TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE TABLE rides (id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), external_id TEXT, name TEXT NOT NULL, category TEXT NOT NULL, manufacturer TEXT NOT NULL DEFAULT '', photo_url TEXT, photo_source_url TEXT, experience TEXT, storytelling TEXT, category_manual INTEGER NOT NULL DEFAULT 0, manufacturer_manual INTEGER NOT NULL DEFAULT 0, experience_manual INTEGER NOT NULL DEFAULT 0, storytelling_manual INTEGER NOT NULL DEFAULT 0, photo_manual INTEGER NOT NULL DEFAULT 0, rating REAL, preferred_row TEXT, review_notes TEXT);
    CREATE TABLE visit_days (id TEXT PRIMARY KEY, park_id TEXT NOT NULL REFERENCES parks(id), visit_date TEXT NOT NULL, trip_notes TEXT, duration_minutes INTEGER, weather TEXT, company TEXT, overall_rating REAL, created_at INTEGER NOT NULL);
    CREATE TABLE ride_logs (id TEXT PRIMARY KEY, visit_day_id TEXT NOT NULL REFERENCES visit_days(id), ride_id TEXT NOT NULL REFERENCES rides(id), status TEXT NOT NULL, lap_count INTEGER NOT NULL DEFAULT 1, row_used TEXT, notes TEXT);
  `);
}

describe("generic external imports", () => {
  it("parses quoted CSV fields into canonical rows", () => {
    expect(parseCsvImport("park_name,ride_name,visit_date,notes\n\"Park, North\",Coaster,2026-05-01,\"Great, ride\"")).toEqual([{
      park_name: "Park, North", ride_name: "Coaster", visit_date: "2026-05-01", notes: "Great, ride", laps: 1, status: "RIDDEN",
    }]);
  });

  it("previews and applies owned records while collapsing duplicate rows", () => {
    const connection = createDatabase(":memory:");
    connections.push(connection);
    createSchema(connection);
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    connection.db.insert(users).values({ id: "user-1", email: "one@example.com", passwordHash: "hash", createdAt }).run();
    const rows = [{ park_name: "Efteling", country: "NL", city: "Kaatsheuvel", latitude: 51.650278, longitude: 5.048056, ride_name: "Baron 1898", visit_date: "2026-05-01", laps: 2, status: "RIDDEN" as const }, { park_name: "Efteling", country: "NL", city: "Kaatsheuvel", latitude: 51.650278, longitude: 5.048056, ride_name: "Baron 1898", visit_date: "2026-05-01", laps: 2, status: "RIDDEN" as const }];

    const plan = buildImportPlan(rows, "user-1", connection.db);

    expect(summarizeImportPlan(plan)).toEqual({ parks: 1, rides: 1, visitDays: 1, rideLogs: 1, duplicates: 1 });
    expect(applyImportPlan(plan, connection.db)).toEqual({ parks: 1, rides: 1, visitDays: 1, rideLogs: 1, duplicates: 1 });
    expect(connection.db.select().from(parks).all()).toHaveLength(1);
    expect(connection.db.select().from(rides).all()).toHaveLength(1);
    expect(connection.db.select().from(visitDays).all()).toHaveLength(1);
    expect(connection.db.select().from(rideLogs).all()).toHaveLength(1);
  });
});
