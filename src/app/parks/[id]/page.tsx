import { notFound } from "next/navigation";
import Link from "next/link";
import { ParkHeroHeader } from "@/components/features/parks/ParkHeroHeader";
import { RideInventoryTable } from "@/components/features/parks/RideInventoryTable";
import { VisitHistoryTimeline } from "@/components/features/parks/VisitHistoryTimeline";
import { getParkDetailData } from "@/core/db/parks";
import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";
import { getQueueTimesStatus } from "@/core/services/queue-times.service";
import { getThemeParksStatus } from "@/core/services/themeparks.service";
import type { ThemeParksStatus } from "@/core/services/themeparks.service";
import { enqueueRideCategoryJobs, recordWaitTimeSnapshots } from "@/core/db/repositories";

export const dynamic = "force-dynamic";

function normalizeRideName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default async function ParkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const park = getParkDetailData(id);
  if (!park) notFound();
  const locale = await getRequestLocale();
  const categoryJobs = park.rides.filter((ride) => ride.externalId).map((ride) => ride.id);
  enqueueRideCategoryJobs(park.id, categoryJobs);
  const queueTimesStatus = await getThemeParksStatus(park.name) ?? (park.externalId ? await getQueueTimesStatus(park.externalId) : null);
  if (queueTimesStatus) {
    const themeParksStatus = "ridesByName" in queueTimesStatus ? queueTimesStatus as ThemeParksStatus : null;
    const source = themeParksStatus?.source ?? "Queue-Times";
    recordWaitTimeSnapshots(park.rides.flatMap((ride) => {
      const status = (ride.externalId ? queueTimesStatus.rides[ride.externalId] : undefined) ?? (themeParksStatus?.ridesByName[normalizeRideName(ride.name)]);
      return status ? [{ rideId: ride.id, source, waitMinutes: status.waitTime, isOpen: status.isOpen }] : [];
    }));
  }
  return <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link href="/parks" className="text-sm text-slate-400 hover:text-amber-200">{translate(locale, "parks.back")}</Link><div className="mt-5"><ParkHeroHeader park={park} /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><RideInventoryTable parkId={park.id} rides={park.rides} queueTimesStatus={queueTimesStatus} /><VisitHistoryTimeline visits={park.visits} /></div></div></main>;
}
