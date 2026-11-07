import { describe, expect, it } from "vitest";
import { buildAnalytics } from "@/core/domain/analytics";

describe("analytics", () => {
  it("ranks parks, rides, days, and estimates observed wait exposure", () => {
    const result = buildAnalytics(
      [
        { id: "visit-1", parkId: "park-1", parkName: "Park One", visitDate: "2026-01-01", durationMinutes: 480, overallRating: 4 },
        { id: "visit-2", parkId: "park-2", parkName: "Park Two", visitDate: "2026-01-02", durationMinutes: null, overallRating: 5 },
      ],
      [
        { id: "ride-1", name: "Coaster", parkName: "Park One", category: "COASTER", rating: 5, preferredRow: "FRONT" },
        { id: "ride-2", name: "Dark Ride", parkName: "Park Two", category: "DARK_RIDE", rating: 4, preferredRow: null },
      ],
      [
        { visitDayId: "visit-1", rideId: "ride-1", status: "RIDDEN", lapCount: 2 },
        { visitDayId: "visit-2", rideId: "ride-2", status: "RIDDEN", lapCount: 1 },
      ],
      [
        { rideId: "ride-1", waitMinutes: 20, observedAt: new Date("2026-01-01T10:00:00Z") },
        { rideId: "ride-1", waitMinutes: 40, observedAt: new Date("2026-01-01T11:00:00Z") },
      ],
    );

    expect(result.totalVisits).toBe(2);
    expect(result.totalLaps).toBe(3);
    expect(result.estimatedWaitMinutes).toBe(30);
    expect(result.parkRankings[0]?.parkName).toBe("Park One");
    expect(result.waitByRide[0]).toMatchObject({ rideName: "Coaster", averageWait: 30, shortestWait: 20 });
    expect(result.bestDays[0]?.parkName).toBe("Park Two");
  });
});
