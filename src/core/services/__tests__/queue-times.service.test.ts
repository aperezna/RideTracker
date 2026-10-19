import { describe, expect, it } from "vitest";

import { searchExternalParks } from "../queue-times.service";

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
});
