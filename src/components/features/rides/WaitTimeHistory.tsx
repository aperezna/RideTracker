import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";
import type { WaitTimeHistoryPoint } from "@/core/db/parks";

export async function WaitTimeHistory({ observations }: { observations: WaitTimeHistoryPoint[] }) {
  const locale = await getRequestLocale();
  const maxWait = Math.max(...observations.map((observation) => observation.waitMinutes ?? 0), 1);
  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return <section className="mx-auto mt-6 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{translate(locale, "ride.waitHistory")}</p><h2 className="mt-1 text-xl font-bold">{translate(locale, "ride.waitHistoryDescription")}</h2>{observations.length === 0 ? <p className="mt-4 text-sm text-slate-400">{translate(locale, "ride.waitHistoryEmpty")}</p> : <div className="mt-5 space-y-3">{observations.map((observation) => { const width = observation.waitMinutes === null ? 0 : Math.max((observation.waitMinutes / maxWait) * 100, 5); return <div key={`${observation.source}-${observation.observedAt.toISOString()}`} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-center"><div className="text-xs text-slate-400"><p>{new Intl.DateTimeFormat(dateLocale, { dateStyle: "short", timeStyle: "short" }).format(observation.observedAt)}</p><p className="text-slate-500">{observation.source}</p></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400" style={{ width: `${width}%` }} /></div><div className="text-right text-sm font-semibold text-slate-200">{observation.waitMinutes === null ? translate(locale, "ride.waitHistoryNoWait") : translate(locale, "ride.waitHistoryMinutes", { count: observation.waitMinutes })}<span className="ml-2 text-xs font-normal text-slate-500">{observation.isOpen === false ? translate(locale, "ride.waitHistoryClosed") : translate(locale, "ride.waitHistoryOpen")}</span></div></div>; })}</div>}</section>;
}
