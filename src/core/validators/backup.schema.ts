import { z } from "zod";

const backupParkSchema = z.object({
  id: z.string(), externalId: z.string().nullable(), name: z.string(), country: z.string(), city: z.string(),
  latitude: z.number(), longitude: z.number(), status: z.enum(["WISHLIST", "PLANNED", "VISITED"]), tripNotes: z.string(), createdAt: z.union([z.string(), z.number(), z.date()]),
});
const backupRideSchema = z.object({
  id: z.string(), parkId: z.string(), externalId: z.string().nullable(), name: z.string(), category: z.enum(["COASTER", "DARK_RIDE", "WATER", "FLAT_RIDE", "SHOW"]), manufacturer: z.string(), rating: z.number().nullable(), preferredRow: z.string().nullable(), reviewNotes: z.string().nullable(),
});
const backupVisitDaySchema = z.object({ id: z.string(), parkId: z.string(), visitDate: z.string(), tripNotes: z.string().nullable(), createdAt: z.union([z.string(), z.number(), z.date()]) });
const backupRideLogSchema = z.object({ id: z.string(), visitDayId: z.string(), rideId: z.string(), status: z.enum(["RIDDEN", "CLOSED"]), lapCount: z.number().int().min(1), rowUsed: z.string().nullable(), notes: z.string().nullable() });

export const backupSchema = z.object({ parks: z.array(backupParkSchema), rides: z.array(backupRideSchema), visitDays: z.array(backupVisitDaySchema), rideLogs: z.array(backupRideLogSchema) });
export type BackupInput = z.infer<typeof backupSchema>;
