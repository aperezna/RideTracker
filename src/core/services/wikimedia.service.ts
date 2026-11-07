import { z } from "zod";

import type { Locale } from "@/core/i18n/translations";
import type { RideCategory } from "@/core/db/schema";
import { getWikidataRideEnrichment } from "./wikidata.service";
import { getRcdbRideEnrichment } from "./rcdb.service";

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
  category: RideCategory | null;
};

export function inferRideCategoryFromWikipedia(content: string | null): RideCategory | null {
  if (!content) return null;
  const infobox = content.match(/^\|\s*(?:type|type_of_ride|ride_type|attraction_type|classification)\s*=\s*(.+)$/gim)?.join(" ") ?? "";
  const introduction = content.split(/^={2,4}\s/m)[0].slice(0, 2_000);
  const text = cleanWikitext(`${infobox} ${introduction}`).toLowerCase();
  if (/water\s+(?:ride|coaster)|log flume|water slide|water attraction/.test(text)) return "WATER";
  if (/roller\s*coaster|rollercoaster|roller_coaster|montaña rusa/.test(text)) return "COASTER";
  if (/dark\s+ride|darkride|haunted house|ghost train/.test(text)) return "DARK_RIDE";
  if (/show|theatrical|theatre|theater|spectacle/.test(text)) return "SHOW";
  if (/flat\s+ride|carousel|ferris wheel|observation wheel|swing ride|drop tower/.test(text)) return "FLAT_RIDE";
  return null;
}

function createTimeoutSignal(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function cleanWikitext(value: string): string {
  return value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2$1").replace(/\{\{[^}]+\}\}/g, "").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "").trim();
}

export function extractWikipediaMetaContent(html: string, property: string): string | null {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escapedProperty}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedProperty}["']`, "i"));
  return match?.[1]?.replace(/&amp;/g, "&").replace(/&#x27;/g, "'") ?? null;
}

export function extractWikipediaLeadText(html: string): string | null {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const paragraph of paragraphs) {
    const text = paragraph[1]
      .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&#39;|&#x27;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 60) return text.slice(0, 3_500);
  }
  return null;
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

async function getWikipediaPageText(title: string, language: string): Promise<string | null> {
  const { signal, cancel } = createTimeoutSignal();
  try {
    const pageTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
    const response = await fetch(`https://${language}.wikipedia.org/wiki/${pageTitle}`, { signal, headers: { accept: "text/html", "user-agent": "RideTracker/1.0" }, next: { revalidate: 86_400 } });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    cancel();
  }
}

export async function getWikipediaManufacturer(title: string, language = "en"): Promise<string | null> {
  return extractManufacturer(await getWikipediaWikitext(title, language));
}

export async function getWikipediaRideCategory(name: string, parkName: string, language = "en"): Promise<RideCategory | null> {
  for (const title of [name, `${name} (${parkName})`]) {
    const directContent = await getWikipediaWikitext(title, language) ?? await getWikipediaPageText(title, language);
    const directCategory = inferRideCategoryFromWikipedia(directContent);
    if (directCategory) return directCategory;
  }
  const title = await findWikipediaTitle(name, parkName, language);
  if (!title) return null;
  const content = await getWikipediaWikitext(title, language) ?? await getWikipediaPageText(title, language);
  return inferRideCategoryFromWikipedia(content);
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

export async function translateEnrichmentText(text: string, sourceLanguage: string, targetLanguage: Locale): Promise<string> {
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
  const candidateTitles = [...new Set(wikipediaTitle ? [wikipediaTitle, `${name} (${parkName})`] : [`${name} (${parkName})`, name])];
  for (const candidateTitle of candidateTitles) {
    const html = await getWikipediaPageText(candidateTitle, language);
    if (!html) continue;
    if (!wikipediaTitle && candidateTitle === name && !html.toLowerCase().includes(parkName.toLowerCase())) continue;
    const article = await getWikipediaWikitext(candidateTitle, language) ?? html;
    const description = extractWikipediaMetaContent(html, "description") ?? extractWikipediaMetaContent(html, "og:description") ?? extractWikipediaLeadText(html);
    const story = extractStorytelling(article) ?? description;
    const title = extractWikipediaMetaContent(html, "og:title") ?? candidateTitle;
    const wikidata = await getWikidataRideEnrichment(name, parkName);
    const wikipediaPhotoUrl = extractWikipediaMetaContent(html, "og:image");
    const wikipediaCategory = inferRideCategoryFromWikipedia(article);
    const rcdb = !wikipediaPhotoUrl || !wikipediaCategory ? await getRcdbRideEnrichment(name, parkName) : null;
    const photoUrl = wikipediaPhotoUrl ?? wikidata?.photoUrl ?? rcdb?.photoUrl ?? null;
    const category = wikipediaCategory ?? wikidata?.category ?? rcdb?.category ?? null;
    return {
      title,
      experience: description ? await translateEnrichmentText(description, language, locale) : null,
      storytelling: story ? await translateEnrichmentText(story, language, locale) : null,
      photoUrl,
      sourceUrl: wikipediaPhotoUrl ? `https://${language}.wikipedia.org/wiki/${encodeURIComponent(candidateTitle.replace(/\s+/g, "_"))}` : wikidata?.photoUrl ? wikidata.sourceUrl : rcdb?.sourceUrl ?? wikidata?.sourceUrl ?? `https://${language}.wikipedia.org/wiki/${encodeURIComponent(candidateTitle.replace(/\s+/g, "_"))}`,
      manufacturer: extractManufacturer(article),
      category,
    };
  }
  const wikidata = await getWikidataRideEnrichment(name, parkName);
  const rcdb = !wikidata?.photoUrl || !wikidata?.category ? await getRcdbRideEnrichment(name, parkName) : null;
  if (!wikidata && !rcdb) return null;
  return { title: wikidata?.title ?? name, experience: null, storytelling: null, photoUrl: wikidata?.photoUrl ?? rcdb?.photoUrl ?? null, sourceUrl: wikidata?.sourceUrl ?? rcdb?.sourceUrl ?? "", manufacturer: null, category: wikidata?.category ?? rcdb?.category ?? null };
}
