import { z } from "zod";

import type { Locale } from "@/core/i18n/translations";

const summarySchema = z.object({
  title: z.string().optional(),
  extract: z.string().optional(),
  content_urls: z.object({ desktop: z.object({ page: z.string() }).optional() }).optional(),
  thumbnail: z.object({ source: z.string() }).optional(),
});

const wikitextSchema = z.object({
  query: z.object({ pages: z.array(z.object({ revisions: z.array(z.object({ slots: z.object({ main: z.object({ content: z.string() }) }) })) })) }),
});

const searchSchema = z.object({
  query: z.object({ search: z.array(z.object({ title: z.string() })) }),
});

const translationSchema = z.object({
  responseData: z.object({ translatedText: z.string() }),
});

export type RideEnrichment = {
  title: string;
  experience: string | null;
  storytelling: string | null;
  photoUrl: string | null;
  sourceUrl: string | null;
  manufacturer: string | null;
};

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function cleanWikitext(value: string): string {
  return value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2$1").replace(/\{\{[^}]+\}\}/g, "").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "").trim();
}

async function getWikipediaWikitext(title: string, language: string): Promise<string | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&titles=${encodeURIComponent(title)}`, { signal, headers: { accept: "application/json", "user-agent": "RideTracker/1.0" }, next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    const parsed = wikitextSchema.safeParse(await response.json());
    const content = parsed.success ? parsed.data.query.pages[0]?.revisions[0]?.slots.main.content : undefined;
    return content ?? null;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

export async function getWikipediaManufacturer(title: string, language = "en"): Promise<string | null> {
  return extractManufacturer(await getWikipediaWikitext(title, language));
}

function extractManufacturer(content: string | null): string | null {
  const match = content?.match(/^\|\s*(?:manufacturer|built\s*by|manufacturer\/designer)\s*=\s*(.+)$/im);
  return match?.[1] ? cleanWikitext(match[1]) || null : null;
}

function extractStorytelling(content: string | null): string | null {
  const section = content?.match(/^={2,4}\s*(?:Theming and design|Story|Storyline|Plot|Ride experience|Experience)\s*={2,4}([\s\S]*?)(?=^={2,4}\s|$)/im)?.[1];
  if (!section) return null;
  const cleaned = cleanWikitext(section).replace(/\n{3,}/g, "\n\n").trim();
  return cleaned ? cleaned.slice(0, 3_500) : null;
}

async function findWikipediaTitle(name: string, parkName: string, language: string): Promise<string | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const search = encodeURIComponent(`${name} ${parkName}`);
    const response = await fetch(`https://${language}.wikipedia.org/w/api.php?action=query&list=search&srnamespace=0&srlimit=5&format=json&formatversion=2&srsearch=${search}`, { signal, headers: { accept: "application/json", "user-agent": "RideTracker/1.0" }, next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    const parsed = searchSchema.safeParse(await response.json());
    if (!parsed.success) return null;
    const normalizedName = name.toLowerCase();
    const normalizedPark = parkName.toLowerCase();
    const candidates = parsed.data.query.search.filter((result) => result.title.toLowerCase().includes(normalizedName));
    candidates.sort((left, right) => scoreWikipediaTitle(right.title, normalizedName, normalizedPark) - scoreWikipediaTitle(left.title, normalizedName, normalizedPark));
    return candidates[0]?.title ?? null;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

async function translateStorytelling(text: string, sourceLanguage: string, targetLanguage: Locale): Promise<string> {
  if (sourceLanguage === targetLanguage || targetLanguage !== "es") return text;
  const { signal, cancel } = createTimeoutSignal();
  try {
    const query = encodeURIComponent(text.slice(0, 4_500));
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${query}&langpair=${sourceLanguage}|${targetLanguage}`, { signal, headers: { accept: "application/json", "user-agent": "RideTracker/1.0" }, next: { revalidate: 86_400 } });
    if (!response.ok) return text;
    const parsed = translationSchema.safeParse(await response.json());
    const translated = parsed.success ? parsed.data.responseData.translatedText.trim() : "";
    return translated || text;
  } catch {
    return text;
  } finally {
    cancel();
  }
}

function scoreWikipediaTitle(title: string, rideName: string, parkName: string): number {
  const normalized = title.toLowerCase();
  if (/\((film|movie|song|album|video game)\)/i.test(normalized)) return -100;
  if (normalized.includes("(attraction)")) return 100;
  if (normalized === rideName) return 95;
  if (normalized.includes(parkName)) return 90;
  return 50;
}

export async function getRideEnrichment(name: string, parkName: string, locale: Locale): Promise<RideEnrichment | null> {
  let language = locale === "es" ? "es" : "en";
  let wikipediaTitle = await findWikipediaTitle(name, parkName, language);
  if (!wikipediaTitle && language !== "en") {
    language = "en";
    wikipediaTitle = await findWikipediaTitle(name, parkName, language);
  }
  if (!wikipediaTitle) return null;
  const title = encodeURIComponent(wikipediaTitle.replace(/\s+/g, "_"));
  const { signal, cancel } = createTimeoutSignal();
  try {
    const response = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      signal,
      headers: { accept: "application/json", "user-agent": "RideTracker/1.0" },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;
    const result = summarySchema.safeParse(await response.json());
    if (!result.success) return null;
    const article = await getWikipediaWikitext(result.data.title ?? name, language);
    const experience = result.data.extract ? await translateStorytelling(result.data.extract, language, locale) : null;
    const story = extractStorytelling(article) ?? result.data.extract ?? null;
    return {
      title: result.data.title ?? name,
      experience,
      storytelling: story ? await translateStorytelling(story, language, locale) : null,
      photoUrl: result.data.thumbnail?.source ?? null,
      sourceUrl: result.data.content_urls?.desktop?.page ?? null,
      manufacturer: extractManufacturer(article),
    };
  } catch {
    return null;
  } finally {
    cancel();
  }
}
