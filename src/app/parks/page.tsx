import { ParksCatalog } from "@/components/features/parks/ParksCatalog";
import { getParkCatalogData } from "@/core/db/parks";

export const dynamic = "force-dynamic";

export default function ParksPage() {
  let parks = [] as ReturnType<typeof getParkCatalogData>;
  try { parks = getParkCatalogData(); } catch { /* Empty database before first migration. */ }
  return <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">RideTracker · Catalog</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your parks</h1><p className="mt-2 text-sm text-slate-400">Keep your wishlist, plans and visited parks in one place.</p></header><ParksCatalog parks={parks} /></div></main>;
}
