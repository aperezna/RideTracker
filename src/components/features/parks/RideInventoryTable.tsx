import Link from "next/link";
import { getRequestLocale } from "@/core/i18n/server";
import { categoryTranslationKey, translate } from "@/core/i18n/translations";
import type { RideInventoryData } from "@/core/domain/park-views";
import type { QueueTimesStatus } from "@/core/services/queue-times.service";
import type { ThemeParksStatus } from "@/core/services/themeparks.service";

function waitTimeClass(waitTime: number): string {
  if (waitTime < 16) return "text-emerald-300";
  if (waitTime < 51) return "text-amber-300";
  return "text-rose-300";
}

function normalizeRideName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export async function RideInventoryTable({ parkId, rides, queueTimesStatus }: { parkId: string; rides: RideInventoryData[]; queueTimesStatus: (QueueTimesStatus | ThemeParksStatus) | null }) {
  const locale = await getRequestLocale();
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{translate(locale, "parks.inventory")}</p><h2 className="mt-1 text-xl font-bold">{translate(locale, "parks.rideTelemetry")}</h2></div><span className="text-xs text-slate-500">{translate(locale, "parks.rides", { count: rides.length })}{queueTimesStatus && " · "}{queueTimesStatus && ("source" in queueTimesStatus ? queueTimesStatus.source : "Queue-Times")}</span></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">{translate(locale, "parks.ride")}</th><th className="pb-3">{translate(locale, "parks.category")}</th><th className="pb-3">{translate(locale, "parks.waitTime")}</th><th className="pb-3">{translate(locale, "parks.preferredRow")}</th><th className="pb-3">{translate(locale, "parks.rating")}</th><th className="pb-3 text-right">{translate(locale, "parks.tripsLaps")}</th></tr></thead><tbody className="divide-y divide-slate-800/80">{rides.map((ride) => { const rideStatus = (ride.externalId ? queueTimesStatus?.rides[ride.externalId] : undefined) ?? (queueTimesStatus && "ridesByName" in queueTimesStatus ? queueTimesStatus.ridesByName[normalizeRideName(ride.name)] : undefined); const isClosed = queueTimesStatus?.parkClosed === true || rideStatus?.isOpen === false; const waitClass = rideStatus?.waitTime === null || rideStatus?.waitTime === undefined ? "text-slate-400" : waitTimeClass(rideStatus.waitTime); return <tr key={ride.id}><td className="py-4 font-semibold text-slate-100"><Link href={`/parks/${parkId}/rides/${ride.id}`} className="hover:text-amber-200">{ride.name}</Link><span className="block text-xs font-normal text-slate-500">{ride.manufacturer || translate(locale, "parks.manufacturerUnknown")}</span></td><td className="py-4 text-slate-400">{translate(locale, categoryTranslationKey(ride.category))}</td><td className={`py-4 font-mono ${isClosed ? "text-rose-300" : waitClass}`}>{isClosed ? translate(locale, "parks.closed") : rideStatus?.waitTime ?? "—"}</td><td className="py-4 text-slate-400">{ride.preferredRow || "—"}</td><td className="py-4 text-amber-300">{ride.rating ?? "—"}</td><td className="py-4 text-right text-slate-400">{ride.totalTrips} / {ride.totalLaps}</td></tr>; })}</tbody></table></div></section>;
}
