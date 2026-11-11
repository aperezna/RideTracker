export const publicEnrichmentSources = [
  {
    id: "queue-times",
    name: "Queue-Times",
    kind: "public-enrichment",
    homepage: "https://queue-times.com/",
    capabilities: ["park-catalog", "live-wait-times"],
  },
  {
    id: "themeparks-wiki",
    name: "ThemeParks.wiki",
    kind: "public-enrichment",
    homepage: "https://themeparks.wiki/",
    capabilities: ["live-wait-times"],
  },
] as const;

export type PublicEnrichmentSource = (typeof publicEnrichmentSources)[number];
export type PublicEnrichmentSourceId = PublicEnrichmentSource["id"];

export function getPublicEnrichmentSource(id: string): PublicEnrichmentSource | undefined {
  return publicEnrichmentSources.find((source) => source.id === id);
}
