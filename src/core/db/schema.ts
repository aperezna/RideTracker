import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const parkStatuses = ["WISHLIST", "PLANNED", "VISITED"] as const;
export const rideCategories = ["COASTER", "DARK_RIDE", "WATER", "FLAT_RIDE", "SHOW", "UNKNOWN"] as const;
export const rideLogStatuses = ["RIDDEN", "CLOSED"] as const;
export const categoryEnrichmentStatuses = ["PENDING", "PROCESSING", "RETRY", "DONE", "FAILED"] as const;

export const parks = sqliteTable("parks", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  externalId: text("external_id"),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  status: text("status", { enum: parkStatuses }).notNull(),
  tripNotes: text("trip_notes").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const rides = sqliteTable("rides", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  externalId: text("external_id"),
  name: text("name").notNull(),
  category: text("category", { enum: rideCategories }).notNull(),
  manufacturer: text("manufacturer").notNull().default(""),
  photoUrl: text("photo_url"),
  photoSourceUrl: text("photo_source_url"),
  experience: text("experience"),
  storytelling: text("storytelling"),
  categoryManual: integer("category_manual", { mode: "boolean" }).notNull().default(false),
  manufacturerManual: integer("manufacturer_manual", { mode: "boolean" }).notNull().default(false),
  experienceManual: integer("experience_manual", { mode: "boolean" }).notNull().default(false),
  storytellingManual: integer("storytelling_manual", { mode: "boolean" }).notNull().default(false),
  photoManual: integer("photo_manual", { mode: "boolean" }).notNull().default(false),
  rating: real("rating"),
  preferredRow: text("preferred_row"),
  reviewNotes: text("review_notes"),
});

export const visitDays = sqliteTable("visit_days", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  visitDate: text("visit_date").notNull(),
  tripNotes: text("trip_notes"),
  durationMinutes: integer("duration_minutes"),
  weather: text("weather"),
  company: text("company"),
  overallRating: real("overall_rating"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const rideLogs = sqliteTable("ride_logs", {
  id: text("id").primaryKey(),
  visitDayId: text("visit_day_id").notNull().references(() => visitDays.id),
  rideId: text("ride_id").notNull().references(() => rides.id),
  status: text("status", { enum: rideLogStatuses }).notNull(),
  lapCount: integer("lap_count").notNull().default(1),
  rowUsed: text("row_used"),
  notes: text("notes"),
});

export const waitTimeObservations = sqliteTable("wait_time_observations", {
  id: text("id").primaryKey(),
  rideId: text("ride_id").notNull().references(() => rides.id),
  source: text("source").notNull(),
  waitMinutes: integer("wait_minutes"),
  isOpen: integer("is_open", { mode: "boolean" }),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
});

export const rideFieldSources = sqliteTable("ride_field_sources", {
  id: text("id").primaryKey(),
  rideId: text("ride_id").notNull().references(() => rides.id),
  field: text("field").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
});

export const rideAliases = sqliteTable("ride_aliases", {
  id: text("id").primaryKey(),
  rideId: text("ride_id").notNull().references(() => rides.id),
  alias: text("alias").notNull(),
  source: text("source"),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
});

export const enrichmentSourceFailures = sqliteTable("enrichment_source_failures", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  scopeKey: text("scope_key").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  retryAfter: integer("retry_after", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const parkOfficialLinks = sqliteTable("park_official_links", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  label: text("label").notNull(),
  url: text("url").notNull(),
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }).notNull(),
});

export const categoryEnrichmentJobs = sqliteTable("category_enrichment_jobs", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  rideId: text("ride_id").notNull().references(() => rides.id),
  status: text("status", { enum: categoryEnrichmentStatuses }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }).notNull(),
  lastError: text("last_error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type ParkStatus = (typeof parkStatuses)[number];
export type RideCategory = (typeof rideCategories)[number];
export type RideLogStatus = (typeof rideLogStatuses)[number];
