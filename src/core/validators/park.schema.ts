import { z } from "zod";

import { parkStatuses } from "../db/schema";

export const parkSchema = z.object({
  id: z.string().min(1).optional(),
  externalId: z.string().min(1).optional().nullable(),
  name: z.string().trim().min(1).max(200),
  country: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  status: z.enum(parkStatuses).default("WISHLIST"),
  tripNotes: z.string().max(5000).default(""),
});

export type ParkInput = z.infer<typeof parkSchema>;
