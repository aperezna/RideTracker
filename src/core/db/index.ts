import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "./data/coastervault.db";

export function createDatabase(url: string) {
  if (url !== ":memory:") mkdirSync(dirname(url), { recursive: true });
  const client = new Database(url);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  return { client, db: drizzle({ client, schema }) };
}

const connection = createDatabase(databaseUrl);
export const db = connection.db;
export const sqlite = connection.client;
