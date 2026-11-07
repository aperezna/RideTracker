import { describe, expect, it } from "vitest";
import { updateVisitDaySchema, visitDaySchema } from "@/core/validators/visit-day.schema";

const baseVisit = { parkId: "park-1", visitDate: "2026-01-15", tripNotes: null };

describe("visit day schemas", () => {
  it("accepts editable visit metadata within bounds", () => {
    expect(updateVisitDaySchema.parse({
      ...baseVisit,
      durationMinutes: 480,
      weather: "Sunny",
      company: "Family",
      overallRating: 4.5,
    })).toMatchObject({ durationMinutes: 480, overallRating: 4.5 });
  });

  it("rejects future visit dates", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    expect(() => visitDaySchema.parse({ ...baseVisit, visitDate: future })).toThrow("Visit date cannot be in the future");
  });

  it("rejects invalid day ratings and durations", () => {
    expect(() => updateVisitDaySchema.parse({ ...baseVisit, durationMinutes: 1_441 })).toThrow();
    expect(() => updateVisitDaySchema.parse({ ...baseVisit, overallRating: 6 })).toThrow();
  });
});
