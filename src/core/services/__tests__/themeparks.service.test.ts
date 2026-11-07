import { describe, expect, it } from "vitest";

import { getThemeParksStatus } from "../themeparks.service";

describe("ThemeParks.wiki status", () => {
  it("matches a park and maps live attraction data by name", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      const body = url.endsWith("/destinations")
        ? { destinations: [{ parks: [{ id: "park-1", name: "Efteling" }] }] }
        : { liveData: [{ id: "ride-1", name: "Danse Macabre", entityType: "ATTRACTION", status: "OPERATING", queue: { STANDBY: { waitTime: 42 } } }] };
      return new Response(JSON.stringify(body), { status: 200 });
    };
    await expect(getThemeParksStatus("Efteling", fetchImpl)).resolves.toMatchObject({ source: "ThemeParks.wiki", ridesByName: { "danse macabre": { isOpen: true, waitTime: 42 } } });
  });

  it("fails soft when the provider is rate limited", async () => {
    const fetchImpl: typeof fetch = async () => new Response("", { status: 429 });
    await expect(getThemeParksStatus("Efteling", fetchImpl)).resolves.toBeNull();
  });
});
