export type EnrichmentAvailability = "AVAILABLE" | "CLOSED" | "UNAVAILABLE";

export type EnrichmentStatusSummary = {
  availability: EnrichmentAvailability;
  source: string | null;
  rideCount: number;
};

export function summarizeEnrichmentStatus(input: { source: string | null; parkClosed: boolean | null; rideCount: number }): EnrichmentStatusSummary {
  return {
    availability: input.source === null ? "UNAVAILABLE" : input.parkClosed ? "CLOSED" : "AVAILABLE",
    source: input.source,
    rideCount: input.rideCount,
  };
}
