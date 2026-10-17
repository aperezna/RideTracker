import { describe, expect, it } from "vitest";

import type { DomainRideLog } from "../coaster-stats";
import {
  countParksByStatus,
  summarizeParksByCountry,
  topCountry,
  totalLaps,
  type DomainPark,
} from "../dashboard-stats";

const parks: DomainPark[] = [
  { id: "p1", name: "A", country: "Spain", latitude: 41, longitude: 2, status: "VISITED" },
  { id: "p2", name: "B", country: "Spain", latitude: 40, longitude: 3, status: "WISHLIST" },
  { id: "p3", name: "C", country: "France", latitude: 48, longitude: 2, status: "VISITED" },
  { id: "p4", name: "D", country: "Germany", latitude: 52, longitude: 13, status: "PLANNED" },
  { id: "p5", name: "E", country: "France", latitude: 49, longitude: 2, status: "PLANNED" },
];

describe("countParksByStatus", () => {
  it("counts parks per status", () => {
    expect(countParksByStatus(parks)).toEqual({ visited: 2, planned: 2, wishlist: 1 });
  });

  it("returns zeroes for an empty park list", () => {
    expect(countParksByStatus([])).toEqual({ visited: 0, planned: 0, wishlist: 0 });
  });
});

describe("summarizeParksByCountry", () => {
  it("aggregates totals per country and orders by total then name", () => {
    expect(summarizeParksByCountry(parks)).toEqual([
      { country: "France", total: 2, visited: 1, planned: 1, wishlist: 0 },
      { country: "Spain", total: 2, visited: 1, planned: 0, wishlist: 1 },
      { country: "Germany", total: 1, visited: 0, planned: 1, wishlist: 0 },
    ]);
  });

  it("returns an empty summary when there are no parks", () => {
    expect(summarizeParksByCountry([])).toEqual([]);
  });
});

describe("topCountry", () => {
  it("returns the country with the most parks", () => {
    expect(topCountry(parks)).toBe("France");
  });

  it("falls back to an em dash when there are no parks", () => {
    expect(topCountry([])).toBe("—");
  });
});

describe("totalLaps", () => {
  it("sums laps of ridden logs only", () => {
    const logs: DomainRideLog[] = [
      { rideId: "r1", status: "RIDDEN", lapCount: 2 },
      { rideId: "r1", status: "RIDDEN", lapCount: 1 },
      { rideId: "r2", status: "CLOSED", lapCount: 9 },
      { rideId: "r3", status: "RIDDEN", lapCount: 0 },
    ];

    expect(totalLaps(logs)).toBe(3);
  });

  it("returns zero for no logs", () => {
    expect(totalLaps([])).toBe(0);
  });
});
