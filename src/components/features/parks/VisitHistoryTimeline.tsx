import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";
import type { VisitHistoryData } from "@/core/domain/park-views";

export async function VisitHistoryTimeline({ visits }: { visits: VisitHistoryData[] }) {
  const locale = await getRequestLocale();
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{translate(locale, "parks.timeline")}</p><h2 className="mt-1 text-xl font-bold">{translate(locale, "parks.visitHistory")}</h2><div className="mt-5 space-y-4">{visits.map((visit) => <article key={visit.id} className="relative border-l border-emerald-400/30 pl-5"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-300" /><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-100">{visit.visitDate}</h3><span className="text-xs text-slate-500">{translate(locale, "parks.checkIns", { count: visit.rideCount })} · {translate(locale, "parks.laps", { count: visit.totalLaps })}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{visit.tripNotes || translate(locale, "parks.noNotesDay")}</p></article>)}{visits.length === 0 && <p className="text-sm text-slate-400">{translate(locale, "parks.noVisits")}</p>}</div></section>;
}
