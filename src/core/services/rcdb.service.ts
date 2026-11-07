import type { RideCategory } from "@/core/db/schema";

type RcdbEnrichment = { photoUrl: string | null; sourceUrl: string; category: RideCategory };

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function extractMeta(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"));
  return match?.[1]?.replace(/&amp;/g, "&") ?? null;
}

export async function getRcdbRideEnrichment(name: string, parkName: string): Promise<RcdbEnrichment | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const searchUrl = `https://rcdb.com/qs.htm?qs=${encodeURIComponent(`${name} ${parkName}`)}`;
    const response = await fetch(searchUrl, { signal, headers: { accept: "text/html", "user-agent": "RideTracker/1.0" } });
    if (!response.ok) return null;
    const searchHtml = await response.text();
    const links = [...searchHtml.matchAll(/href=["'](\/\d+\/[^"']+\.htm)["']/gi)].map((match) => match[1]);
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const path = links.find((link) => link.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(normalizedName));
    if (!path) return null;
    const sourceUrl = `https://rcdb.com${path}`;
    const pageResponse = await fetch(sourceUrl, { signal, headers: { accept: "text/html", "user-agent": "RideTracker/1.0" } });
    if (!pageResponse.ok) return null;
    return { photoUrl: extractMeta(await pageResponse.text(), "og:image"), sourceUrl, category: "COASTER" };
  } catch {
    return null;
  } finally {
    cancel();
  }
}
