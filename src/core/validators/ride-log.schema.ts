import { z } from "zod";

import { rideLogStatuses } from "../db/schema";

export const rideLogSchema = z.object({
  visitDayId: z.string().min(1),
  rideId: z.string().min(1),
  status: z.enum(rideLogStatuses).default("RIDDEN"),
  lapCount: z.coerce.number().int().min(1).default(1),
  rowUsed: z.string().trim().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export type RideLogInput = z.infer<typeof rideLogSchema>;
