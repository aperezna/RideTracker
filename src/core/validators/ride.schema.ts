import { z } from "zod";

import { rideCategories } from "../db/schema";

export const preferredRowSchema = z.string().trim().min(1).max(100);

export const rideSchema = z.object({
  id: z.string().min(1).optional(),
  parkId: z.string().min(1),
  externalId: z.string().min(1).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  category: z.enum(rideCategories),
  manufacturer: z.string().trim().max(200).default(""),
  rating: z.coerce.number().min(1).max(10).nullable().optional(),
  preferredRow: preferredRowSchema.nullable().optional(),
  reviewNotes: z.string().max(5000).nullable().optional(),
});

export type RideInput = z.infer<typeof rideSchema>;
