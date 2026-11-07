import { z } from "zod";

import type { RideCategory } from "@/core/db/schema";

const searchSchema = z.object({
  search: z.array(z.object({ id: z.string(), label: z.string().optional(), description: z.string().optional() })),
});

const entitySchema = z.object({
  entities: z.record(z.string(), z.object({
    labels: z.record(z.string(), z.object({ value: z.string() })).optional(),
    descriptions: z.record(z.string(), z.object({ value: z.string() })).optional(),
    claims: z.record(z.string(), z.array(z.object({ mainsnak: z.object({ datavalue: z.object({ value: z.unknown() }).optional() }).optional() }))).optional(),
  })),
});

export type WikidataEnrichment = {
  title: string;
  photoUrl: string | null;
  sourceUrl: string;
  category: RideCategory | null;
};

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function inferCategory(text: string): RideCategory | null {
  const normalized = text.toLowerCase();
  if (/water ride|water coaster|log flume|water slide/.test(normalized)) return "WATER";
  if (/roller coaster|rollercoaster/.test(normalized)) return "COASTER";
  if (/dark ride|darkride|haunted house|ghost train/.test(normalized)) return "DARK_RIDE";
  if (/show|theatrical|theatre|theater/.test(normalized)) return "SHOW";
  if (/carousel|ferris wheel|observation wheel|swing ride|drop tower|flat ride/.test(normalized)) return "FLAT_RIDE";
  return null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const response = await fetch(url, { signal, headers: { accept: "application/json", "user-agent": "RideTracker/1.0" }, next: { revalidate: 86_400 } });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

function scoreCandidate(label: string, description: string, rideName: string, parkName: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedDescription = description.toLowerCase();
  const normalizedRide = rideName.toLowerCase();
  const normalizedPark = parkName.toLowerCase();
  return (normalizedLabel === normalizedRide ? 100 : normalizedLabel.includes(normalizedRide) ? 70 : 0)
    + (normalizedLabel.includes(normalizedPark) ? 30 : 0)
    + (normalizedDescription.includes(normalizedPark) ? 20 : 0);
}

export async function getWikidataRideEnrichment(name: string, parkName: string): Promise<WikidataEnrichment | null> {
  const search = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(`${name} ${parkName}`)}&language=en&uselang=en&format=json&limit=5`);
  const parsedSearch = searchSchema.safeParse(search);
  if (!parsedSearch.success) return null;
  const candidate = [...parsedSearch.data.search]
    .sort((left, right) => scoreCandidate(right.label ?? "", right.description ?? "", name, parkName) - scoreCandidate(left.label ?? "", left.description ?? "", name, parkName))[0];
  if (!candidate) return null;

  const entity = entitySchema.safeParse(await fetchJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(candidate.id)}&props=claims|labels|descriptions&languages=en&format=json`));
  if (!entity.success) return null;
  const data = entity.data.entities[candidate.id];
  if (!data) return null;
  const description = data.descriptions?.en?.value ?? candidate.description ?? "";
  const imageValue = data.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  const photoUrl = typeof imageValue === "string" ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageValue)}` : null;
  if (!photoUrl && !inferCategory(`${candidate.label ?? ""} ${description}`)) return null;
  return {
    title: data.labels?.en?.value ?? candidate.label ?? candidate.id,
    photoUrl,
    sourceUrl: `https://www.wikidata.org/wiki/${candidate.id}`,
    category: inferCategory(`${candidate.label ?? ""} ${description}`),
  };
}
