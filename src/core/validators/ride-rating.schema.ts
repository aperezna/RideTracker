import { z } from "zod";

import { preferredRowSchema } from "./ride.schema";

export const rideRatingSchema = z.object({
  rideId: z.string().min(1),
  rating: z.coerce.number().min(1).max(10),
  preferredRow: preferredRowSchema.nullable().optional(),
  reviewNotes: z.string().max(5000).nullable().optional(),
});

export type RideRatingInput = z.infer<typeof rideRatingSchema>;
