import { describe, expect, it } from "vitest";

import {
  calculateTopTen,
  calculateUniqueCoasterCount,
  transitionParkStatusOnFirstVisit,
  type DomainRide,
  type DomainRideLog,
} from "../coaster-stats";

const rides: DomainRide[] = [
  { id: "coaster-1", name: "Thunder", category: "COASTER", rating: 9.5 },
  { id: "coaster-2", name: "Lightning", category: "COASTER", rating: 9.5 },
  { id: "dark-ride-1", name: "Phantom", category: "DARK_RIDE", rating: 8 },
  { id: "unrated", name: "Unrated", category: "COASTER", rating: null },
];

const logs: DomainRideLog[] = [
  { rideId: "coaster-1", status: "RIDDEN", lapCount: 2 },
  { rideId: "coaster-1", status: "RIDDEN", lapCount: 1 },
  { rideId: "coaster-2", status: "RIDDEN", lapCount: 1 },
  { rideId: "dark-ride-1", status: "RIDDEN", lapCount: 3 },
  { rideId: "unrated", status: "RIDDEN", lapCount: 1 },
  { rideId: "coaster-2", status: "CLOSED", lapCount: 0 },
];

describe("transitionParkStatusOnFirstVisit", () => {
  it.each(["WISHLIST", "PLANNED"] as const)("transitions %s to VISITED", (status) => {
    expect(transitionParkStatusOnFirstVisit(status)).toBe("VISITED");
  });

  it("keeps an already visited park visited", () => {
    expect(transitionParkStatusOnFirstVisit("VISITED")).toBe("VISITED");
  });
});

describe("calculateUniqueCoasterCount", () => {
  it("counts each ridden coaster once across historical logs", () => {
    expect(calculateUniqueCoasterCount(rides, logs)).toBe(3);
  });

  it("ignores closed logs and non-coasters", () => {
    expect(
      calculateUniqueCoasterCount(rides, [
        { rideId: "coaster-2", status: "CLOSED", lapCount: 1 },
        { rideId: "dark-ride-1", status: "RIDDEN", lapCount: 2 },
      ]),
    ).toBe(0);
  });
});

describe("calculateTopTen", () => {
  it("filters unrated rides and orders by rating then total laps", () => {
    expect(calculateTopTen(rides, logs)).toEqual([
      { ...rides[0], totalLaps: 3 },
      { ...rides[1], totalLaps: 1 },
      { ...rides[2], totalLaps: 3 },
    ]);
  });

  it("returns no more than ten ridden, rated rides", () => {
    const manyRides = Array.from({ length: 11 }, (_, index) => ({
      id: `ride-${index}`,
      name: `Ride ${index}`,
      category: "FLAT_RIDE" as const,
      rating: index + 1,
    }));
    const manyLogs = manyRides.map((ride) => ({ rideId: ride.id, status: "RIDDEN" as const, lapCount: 1 }));

    expect(calculateTopTen(manyRides, manyLogs)).toHaveLength(10);
  });
});
