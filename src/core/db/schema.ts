import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const parkStatuses = ["WISHLIST", "PLANNED", "VISITED"] as const;
export const rideCategories = ["COASTER", "DARK_RIDE", "WATER", "FLAT_RIDE", "SHOW"] as const;
export const rideLogStatuses = ["RIDDEN", "CLOSED"] as const;

export const parks = sqliteTable("parks", {
  id: text("id").primaryKey(),
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

export const rides = sqliteTable("rides", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  externalId: text("external_id"),
  name: text("name").notNull(),
  category: text("category", { enum: rideCategories }).notNull(),
  manufacturer: text("manufacturer").notNull().default(""),
  rating: real("rating"),
  preferredRow: text("preferred_row"),
  reviewNotes: text("review_notes"),
});

export const visitDays = sqliteTable("visit_days", {
  id: text("id").primaryKey(),
  parkId: text("park_id").notNull().references(() => parks.id),
  visitDate: text("visit_date").notNull(),
  tripNotes: text("trip_notes"),
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

export type ParkStatus = (typeof parkStatuses)[number];
export type RideCategory = (typeof rideCategories)[number];
export type RideLogStatus = (typeof rideLogStatuses)[number];
