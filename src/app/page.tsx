import { getDashboardData } from "@/core/db/dashboard";
import type { DashboardView } from "@/core/domain/dashboard-stats";

import { KpiStatsRow } from "@/components/features/dashboard/KpiStatsRow";
import { ParksWorldMap } from "@/components/features/dashboard/ParksWorldMap";
import { TopRidesLeaderboard } from "@/components/features/dashboard/TopRidesLeaderboard";
import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";
import { getAnalyticsData } from "@/core/db/analytics";
import { AnalyticsPanel } from "@/components/features/dashboard/AnalyticsPanel";
import { requireCurrentUserId } from "@/core/auth/current-user";

export const dynamic = "force-dynamic";

const emptyDashboard: DashboardView = { uniqueCoasterCount: 0, visitedParks: 0, plannedParks: 0, wishlistParks: 0, totalLaps: 0, topCountry: "—", topRides: [], parks: [], countries: [] };

export default async function Home() {
  const userId = await requireCurrentUserId();
  let dashboard = emptyDashboard;
  try { dashboard = getDashboardData(userId); } catch { /* Empty database before first migration. */ }
  const analytics = getAnalyticsData(userId);

  return <HomeContent dashboard={dashboard} analytics={analytics} />;
}

async function HomeContent({ dashboard, analytics }: { dashboard: DashboardView; analytics: Awaited<ReturnType<typeof getAnalyticsData>> }) {
  const locale = await getRequestLocale();
  return (
    <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
           <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{translate(locale, "dashboard.commandCenter")}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{translate(locale, "dashboard.season")}</h1><p className="mt-2 text-sm text-slate-400">{translate(locale, "dashboard.description")}</p></div>
           <div className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">{translate(locale, "dashboard.live")}</div>
        </header>
         <KpiStatsRow {...dashboard} locale={locale} />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <ParksWorldMap parks={dashboard.parks} countries={dashboard.countries} />
           <TopRidesLeaderboard rides={dashboard.topRides} locale={locale} />
         </div>
         <AnalyticsPanel analytics={analytics} locale={locale} />
      </div>
    </main>
  );
}
