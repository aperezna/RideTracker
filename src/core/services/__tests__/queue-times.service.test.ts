import { describe, expect, it } from "vitest";

import { getQueueTimesStatus, searchExternalParks } from "../queue-times.service";

describe("Queue-Times park search", () => {
  it("searches the current array-of-continents response format", async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify([
      {
        id: 11,
        name: "Europe",
        parks: [{
          id: 123,
          name: "Efteling",
          country: "Netherlands",
          latitude: "51.6507",
          longitude: "5.0497",
        }],
      },
    ]), { status: 200, headers: { "Content-Type": "application/json" } });

    await expect(searchExternalParks("efteling", fetchImpl)).resolves.toEqual([{
      externalId: "123",
      name: "Efteling",
      country: "Netherlands",
      city: "Unknown",
      latitude: 51.6507,
      longitude: 5.0497,
      rides: [],
    }]);
  });

  it("preserves manufacturer and normalizes ride categories", async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({ parks: [{
      id: 123,
      name: "Efteling",
      country: "Netherlands",
      city: "Kaatsheuvel",
      latitude: 51.65,
      longitude: 5.04,
      rides: [
        { id: 1, name: "Baron 1898", category: "roller coaster", manufacturer: "Bolliger & Mabillard" },
        { id: 2, name: "Fata Morgana", category: "dark ride", manufacturer: "Vekoma" },
        { id: 3, name: "Piraña", category: "water ride", manufacturer: "Intamin" },
      ],
    }] }), { status: 200, headers: { "Content-Type": "application/json" } });

    await expect(searchExternalParks("efteling", fetchImpl)).resolves.toMatchObject([{
      rides: [
        { category: "COASTER", manufacturer: "Bolliger & Mabillard" },
        { category: "DARK_RIDE", manufacturer: "Vekoma" },
        { category: "WATER", manufacturer: "Intamin" },
      ],
    }]);
  });

  it("normalizes live wait times and derives a closed park from closed rides", async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      rides: [{ id: 1, name: "Open ride", is_open: false, wait_time: 0 }],
      lands: [{ rides: [{ id: 2, name: "Closed ride", is_open: false, wait_time: 0 }] }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });

    await expect(getQueueTimesStatus("123", fetchImpl, "https://queue-times.test")).resolves.toEqual({
      parkClosed: true,
      rides: {
        "1": { isOpen: false, waitTime: 0 },
        "2": { isOpen: false, waitTime: 0 },
      },
    });
  });

  it("keeps a park open when at least one ride is open", async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      rides: [{ id: 1, name: "Open ride", is_open: true, wait_time: 25 }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });

    await expect(getQueueTimesStatus("123", fetchImpl, "https://queue-times.test")).resolves.toEqual({
      parkClosed: false,
      rides: { "1": { isOpen: true, waitTime: 25 } },
    });
  });
});
