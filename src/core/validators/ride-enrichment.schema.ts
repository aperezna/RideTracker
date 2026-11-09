import { z } from "zod";

export const rideEnrichmentUpdateSchema = z.object({
  rideId: z.string().min(1),
  category: z.enum(["COASTER", "WATER", "DARK_RIDE", "FLAT_RIDE", "SHOW", "UNKNOWN"]).optional(),
  manufacturer: z.string().trim().max(200).optional(),
  experience: z.string().trim().max(5000).optional(),
  storytelling: z.string().trim().max(5000).optional(),
}).refine(({ category, manufacturer, experience, storytelling }) => [category, manufacturer, experience, storytelling].some((value) => value !== undefined), "At least one field is required");

export type RideEnrichmentUpdateInput = z.infer<typeof rideEnrichmentUpdateSchema>;
