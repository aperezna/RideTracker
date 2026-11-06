import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./translations";

export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | undefined): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const preferred = acceptLanguage?.toLowerCase().split(",").map((value) => value.split(";")[0].trim());
  if (preferred?.some((value) => value === "es" || value.startsWith("es-"))) return "es";
  return defaultLocale;
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  return resolveLocale(cookieStore.get(localeCookieName)?.value, requestHeaders.get("accept-language") ?? undefined);
}
