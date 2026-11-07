import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}, "Expected a valid calendar date");

const visitDayFields = z.object({
  parkId: z.string().min(1),
  visitDate: isoDateSchema,
  tripNotes: z.string().max(5000).nullable().optional(),
});

const noFutureVisitDate = <T extends z.ZodTypeAny>(schema: T) => schema.refine((value) => {
  if (!value || typeof value !== "object" || !("visitDate" in value)) return true;
  return value.visitDate <= new Date().toISOString().slice(0, 10);
}, { message: "Visit date cannot be in the future", path: ["visitDate"] });

export const visitDaySchema = noFutureVisitDate(visitDayFields);

export const updateVisitDaySchema = noFutureVisitDate(visitDayFields.extend({
  durationMinutes: z.number().int().min(0).max(1_440).nullable().optional(),
  weather: z.string().max(200).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  overallRating: z.number().min(1).max(5).nullable().optional(),
}));

export type VisitDayInput = z.infer<typeof visitDaySchema>;
