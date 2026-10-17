import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "./data/coastervault.db";
mkdirSync(dirname(databaseUrl), { recursive: true });

const sqlite = new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle({ client: sqlite, schema });
export { sqlite };
