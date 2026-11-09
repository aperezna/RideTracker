import { ParksCatalog } from "@/components/features/parks/ParksCatalog";
import { getParkCatalogData } from "@/core/db/parks";
import { requireCurrentUserId } from "@/core/auth/current-user";
import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";

export const dynamic = "force-dynamic";

export default async function ParksPage() {
  const userId = await requireCurrentUserId();
  const locale = await getRequestLocale();
  let parks = [] as ReturnType<typeof getParkCatalogData>;
  try { parks = getParkCatalogData(userId); } catch { /* Empty database before first migration. */ }
  return <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{translate(locale, "parks.catalog")}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{translate(locale, "parks.title")}</h1><p className="mt-2 text-sm text-slate-400">{translate(locale, "parks.description")}</p></header><ParksCatalog parks={parks} /></div></main>;
}
