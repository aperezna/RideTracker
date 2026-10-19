import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as schema from "./schema";

function ensureSchema(client: Database.Database): void {
  client.exec(`
    CREATE TABLE IF NOT EXISTS parks (
      id TEXT PRIMARY KEY,
      external_id TEXT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL,
      trip_notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      park_id TEXT NOT NULL REFERENCES parks(id),
      external_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      manufacturer TEXT NOT NULL DEFAULT '',
      rating REAL,
      preferred_row TEXT,
      review_notes TEXT
    );
    CREATE TABLE IF NOT EXISTS visit_days (
      id TEXT PRIMARY KEY,
      park_id TEXT NOT NULL REFERENCES parks(id),
      visit_date TEXT NOT NULL,
      trip_notes TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ride_logs (
      id TEXT PRIMARY KEY,
      visit_day_id TEXT NOT NULL REFERENCES visit_days(id),
      ride_id TEXT NOT NULL REFERENCES rides(id),
      status TEXT NOT NULL,
      lap_count INTEGER NOT NULL DEFAULT 1,
      row_used TEXT,
      notes TEXT
    );
  `);
}

const databaseUrl = process.env.DATABASE_URL ?? "./data/coastervault.db";

export function createDatabase(url: string) {
  if (url !== ":memory:") mkdirSync(dirname(url), { recursive: true });
  const client = new Database(url);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  if (url !== ":memory:") ensureSchema(client);
  return { client, db: drizzle({ client, schema }) };
}

const connection = createDatabase(databaseUrl);
export const db = connection.db;
export const sqlite = connection.client;
