import { z } from "zod";

const backupParkSchema = z.object({
  id: z.string(), externalId: z.string().nullable(), name: z.string(), country: z.string(), city: z.string(),
  latitude: z.number(), longitude: z.number(), status: z.enum(["WISHLIST", "PLANNED", "VISITED"]), tripNotes: z.string(), createdAt: z.union([z.string(), z.number(), z.date()]),
});
const backupRideSchema = z.object({
  id: z.string(), parkId: z.string(), externalId: z.string().nullable(), name: z.string(), category: z.enum(["COASTER", "DARK_RIDE", "WATER", "FLAT_RIDE", "SHOW", "UNKNOWN"]), manufacturer: z.string(), photoUrl: z.string().nullable().optional(), photoSourceUrl: z.string().nullable().optional(), rating: z.number().nullable(), preferredRow: z.string().nullable(), reviewNotes: z.string().nullable(),
});
const backupVisitDaySchema = z.object({ id: z.string(), parkId: z.string(), visitDate: z.string(), tripNotes: z.string().nullable(), durationMinutes: z.number().int().nullable().optional(), weather: z.string().nullable().optional(), company: z.string().nullable().optional(), overallRating: z.number().nullable().optional(), createdAt: z.union([z.string(), z.number(), z.date()]) });
const backupRideLogSchema = z.object({ id: z.string(), visitDayId: z.string(), rideId: z.string(), status: z.enum(["RIDDEN", "CLOSED"]), lapCount: z.number().int().min(1), rowUsed: z.string().nullable(), notes: z.string().nullable() });
const backupWaitObservationSchema = z.object({ id: z.string(), rideId: z.string(), source: z.string(), waitMinutes: z.number().int().nullable(), isOpen: z.boolean().nullable(), observedAt: z.union([z.string(), z.number(), z.date()]) });

export const backupSchema = z.object({ parks: z.array(backupParkSchema), rides: z.array(backupRideSchema), visitDays: z.array(backupVisitDaySchema), rideLogs: z.array(backupRideLogSchema), waitTimeObservations: z.array(backupWaitObservationSchema).optional() });
export type BackupInput = z.infer<typeof backupSchema>;
