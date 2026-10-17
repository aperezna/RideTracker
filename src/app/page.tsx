import { getDashboardData } from "@/core/db/dashboard";
import type { DashboardView } from "@/core/domain/dashboard-stats";

import { KpiStatsRow } from "@/components/features/dashboard/KpiStatsRow";
import { ParksWorldMap } from "@/components/features/dashboard/ParksWorldMap";
import { TopRidesLeaderboard } from "@/components/features/dashboard/TopRidesLeaderboard";

export const dynamic = "force-dynamic";

const emptyDashboard: DashboardView = { uniqueCoasterCount: 0, visitedParks: 0, plannedParks: 0, wishlistParks: 0, totalLaps: 0, topCountry: "—", topRides: [], parks: [], countries: [] };

export default function Home() {
  let dashboard = emptyDashboard;
  try { dashboard = getDashboardData(); } catch { /* Empty database before first migration. */ }

  return (
    <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">RideTracker · Command Center</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your park season</h1><p className="mt-2 text-sm text-slate-400">A personal view of every park, lap and favorite ride.</p></div>
          <div className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">Live SQLite dashboard</div>
        </header>
        <KpiStatsRow {...dashboard} />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <ParksWorldMap parks={dashboard.parks} countries={dashboard.countries} />
          <TopRidesLeaderboard rides={dashboard.topRides} />
        </div>
      </div>
    </main>
  );
}
