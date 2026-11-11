import { describe, expect, it } from "vitest";

import { getPublicEnrichmentSource, publicEnrichmentSources } from "../public-enrichment";

describe("public enrichment source registry", () => {
  it("describes public sources separately from personal imports", () => {
    expect(publicEnrichmentSources.map((source) => source.id)).toEqual(["queue-times", "themeparks-wiki"]);
    expect(publicEnrichmentSources.every((source) => source.kind === "public-enrichment")).toBe(true);
    expect(publicEnrichmentSources.flatMap((source) => source.capabilities)).toEqual(expect.arrayContaining(["park-catalog", "live-wait-times"]));
  });

  it("returns metadata only for known public enrichment sources", () => {
    expect(getPublicEnrichmentSource("themeparks-wiki")).toMatchObject({
      name: "ThemeParks.wiki",
      homepage: "https://themeparks.wiki/",
    });
    expect(getPublicEnrichmentSource("logride")).toBeUndefined();
  });
});
