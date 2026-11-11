import { describe, expect, it } from "vitest";

import { summarizeEnrichmentStatus } from "../enrichment-status";

describe("enrichment status summary", () => {
  it("reports the provider and available live signals", () => {
    expect(summarizeEnrichmentStatus({ source: "ThemeParks.wiki", parkClosed: false, rideCount: 12 })).toEqual({
      availability: "AVAILABLE",
      source: "ThemeParks.wiki",
      rideCount: 12,
    });
  });

  it("keeps closed and unavailable states distinct", () => {
    expect(summarizeEnrichmentStatus({ source: "Queue-Times", parkClosed: true, rideCount: 4 }).availability).toBe("CLOSED");
    expect(summarizeEnrichmentStatus({ source: null, parkClosed: null, rideCount: 4 }).availability).toBe("UNAVAILABLE");
  });
});
