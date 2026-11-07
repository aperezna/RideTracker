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
      duration_minutes INTEGER,
      weather TEXT,
      company TEXT,
      overall_rating REAL,
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
    CREATE TABLE IF NOT EXISTS category_enrichment_jobs (
      id TEXT PRIMARY KEY,
      park_id TEXT NOT NULL REFERENCES parks(id),
      ride_id TEXT NOT NULL REFERENCES rides(id),
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL,
      last_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  const addColumnIfMissing = (table: "rides" | "visit_days", name: string, definition: string) => {
    const columns = client.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (columns.some((column) => column.name === name)) return;
    try {
      client.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes(`duplicate column name: ${name}`)) throw error;
    }
  };
  addColumnIfMissing("rides", "photo_url", "TEXT");
  addColumnIfMissing("rides", "photo_source_url", "TEXT");
  addColumnIfMissing("rides", "experience", "TEXT");
  addColumnIfMissing("rides", "storytelling", "TEXT");
  addColumnIfMissing("visit_days", "duration_minutes", "INTEGER");
  addColumnIfMissing("visit_days", "weather", "TEXT");
  addColumnIfMissing("visit_days", "company", "TEXT");
  addColumnIfMissing("visit_days", "overall_rating", "REAL");
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
