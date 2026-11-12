"use client";

import { useMemo, useState } from "react";

import { filterWaitTimeHistory, summarizeWaitTimeHistory, type WaitTimeHistoryPeriod, type WaitTimeHistoryRecord } from "@/core/domain/wait-time-history";
import { translate, type Locale } from "@/core/i18n/translations";

type WaitTimeHistoryChartProps = { locale: Locale; observations: Array<WaitTimeHistoryRecord & { source: string; isOpen: boolean | null; observedAt: string }> };

export function WaitTimeHistoryChart({ locale, observations }: WaitTimeHistoryChartProps) {
  const [period, setPeriod] = useState<WaitTimeHistoryPeriod>("all");
  const filteredObservations = useMemo(() => filterWaitTimeHistory(observations, period), [observations, period]);
  const summary = useMemo(() => summarizeWaitTimeHistory(filteredObservations), [filteredObservations]);
  const maxWait = Math.max(...filteredObservations.map((observation) => observation.waitMinutes ?? 0), 1);
  const dateLocale = locale === "es" ? "es-ES" : "en-US";
  const periodOptions: Array<[WaitTimeHistoryPeriod, "ride.waitHistory24h" | "ride.waitHistory7d" | "ride.waitHistoryAll"]> = [["24h", "ride.waitHistory24h"], ["7d", "ride.waitHistory7d"], ["all", "ride.waitHistoryAll"]];
  const formatWait = (wait: number | null) => wait === null ? translate(locale, "ride.waitHistoryNoWait") : translate(locale, "ride.waitHistoryMinutes", { count: wait });

  return <section className="mx-auto mt-6 max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{translate(locale, "ride.waitHistory")}</p><h2 className="mt-1 text-xl font-bold">{translate(locale, "ride.waitHistoryDescription")}</h2></div><div className="flex flex-wrap gap-2" role="group" aria-label={translate(locale, "ride.waitHistoryPeriod")}>
    {periodOptions.map(([value, label]) => <button key={value} type="button" onClick={() => setPeriod(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${period === value ? "bg-violet-400 text-slate-950" : "border border-slate-700 text-slate-300"}`}>{translate(locale, label)}</button>)}
  </div></div>{filteredObservations.length === 0 ? <p className="mt-4 text-sm text-slate-400">{translate(locale, "ride.waitHistoryEmpty")}</p> : <><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "ride.waitHistoryAverage")}</p><p className="mt-1 font-semibold text-slate-100">{formatWait(summary.average)}</p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "ride.waitHistoryMinimum")}</p><p className="mt-1 font-semibold text-emerald-300">{formatWait(summary.minimum)}</p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "ride.waitHistoryMaximum")}</p><p className="mt-1 font-semibold text-rose-300">{formatWait(summary.maximum)}</p></div></div><div className="mt-5 space-y-3">{filteredObservations.map((observation) => { const width = observation.waitMinutes === null ? 0 : Math.max((observation.waitMinutes / maxWait) * 100, 5); return <div key={`${observation.source}-${observation.observedAt}`} className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-center"><div className="text-xs text-slate-400"><p>{new Intl.DateTimeFormat(dateLocale, { dateStyle: "short", timeStyle: "short" }).format(new Date(observation.observedAt))}</p><p className="text-slate-500">{observation.source}</p></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400" style={{ width: `${width}%` }} /></div><div className="text-right text-sm font-semibold text-slate-200">{formatWait(observation.waitMinutes)}<span className="ml-2 text-xs font-normal text-slate-500">{observation.isOpen === false ? translate(locale, "ride.waitHistoryClosed") : translate(locale, "ride.waitHistoryOpen")}</span></div></div>; })}</div></>}</section>;
}
