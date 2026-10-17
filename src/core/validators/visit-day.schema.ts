import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}, "Expected a valid calendar date");

export const visitDaySchema = z.object({
  parkId: z.string().min(1),
  visitDate: isoDateSchema,
  tripNotes: z.string().max(5000).nullable().optional(),
});

export type VisitDayInput = z.infer<typeof visitDaySchema>;
