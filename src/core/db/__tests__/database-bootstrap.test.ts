import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "../index";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("SQLite database bootstrap", () => {
  it("creates the application tables for a new file database", () => {
    const directory = mkdtempSync(join(tmpdir(), "ridetracker-db-"));
    temporaryDirectories.push(directory);
    const connection = createDatabase(join(directory, "coastervault.db"));

    const tables = connection.client.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as Array<{ name: string }>;
    expect(tables.map((table) => table.name)).toEqual(["category_enrichment_jobs", "enrichment_source_failures", "park_official_links", "parks", "ride_aliases", "ride_field_sources", "ride_logs", "rides", "users", "visit_days", "wait_time_observations"]);
    const visitColumns = connection.client.prepare("PRAGMA table_info(visit_days)").all() as Array<{ name: string }>;
    expect(visitColumns.map((column) => column.name)).toEqual(["id", "park_id", "visit_date", "trip_notes", "duration_minutes", "weather", "company", "overall_rating", "created_at"]);
    connection.client.close();
  });
});
