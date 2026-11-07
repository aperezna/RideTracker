"use client";

import { useState, useTransition } from "react";
import { updateVisitDay } from "@/actions/visit.actions";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { translate } from "@/core/i18n/translations";
import type { VisitDayData } from "@/core/domain/park-views";

export function VisitDayHeader({ visit }: { visit: VisitDayData }) {
  const [notes, setNotes] = useState(visit.tripNotes ?? "");
  const [visitDate, setVisitDate] = useState(visit.visitDate);
  const [durationMinutes, setDurationMinutes] = useState(visit.durationMinutes?.toString() ?? "");
  const [weather, setWeather] = useState(visit.weather ?? "");
  const [company, setCompany] = useState(visit.company ?? "");
  const [overallRating, setOverallRating] = useState(visit.overallRating?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const { locale } = useLocale();
  const totalLaps = visit.rides.reduce((sum, ride) => sum + ride.lapCount, 0);
  const ridden = visit.rides.filter((ride) => ride.checkInCount > 0).length;
  function save() {
    startTransition(async () => {
      await updateVisitDay(visit.id, {
        parkId: visit.parkId,
        visitDate,
        tripNotes: notes,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        weather: weather || null,
        company: company || null,
        overallRating: overallRating ? Number(overallRating) : null,
      });
    });
  }
  return <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{translate(locale, "visits.parkVisit", { date: visit.visitDate })}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{visit.parkName}</h1><p className="mt-2 text-sm text-slate-400">{visit.city}, {visit.country}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">{translate(locale, "visits.historicalVisit")}</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="rounded-xl bg-slate-950/60 p-3 text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.visitDate")}<input type="date" value={visitDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setVisitDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm normal-case tracking-normal text-slate-100" /></label><label className="rounded-xl bg-slate-950/60 p-3 text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.duration")}<input type="number" min="0" max="1440" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm normal-case tracking-normal text-slate-100" /></label><label className="rounded-xl bg-slate-950/60 p-3 text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.weather")}<input value={weather} onChange={(event) => setWeather(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm normal-case tracking-normal text-slate-100" /></label><label className="rounded-xl bg-slate-950/60 p-3 text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.company")}<input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm normal-case tracking-normal text-slate-100" /></label><label className="rounded-xl bg-slate-950/60 p-3 text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.overallRating")}<select value={overallRating} onChange={(event) => setOverallRating(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm normal-case tracking-normal text-slate-100"><option value="">—</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}</select></label><div className="rounded-xl bg-slate-950/60 p-3 sm:col-span-2"><label className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.dayNotes")}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20 w-full resize-none bg-transparent text-sm normal-case tracking-normal text-slate-100 outline-none" placeholder={translate(locale, "visits.weatherNotes")} /></label></div></div><div className="mt-3 flex items-center justify-between"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.uniqueRides")}</p><p className="mt-1 text-2xl font-bold text-slate-100">{ridden}<span className="text-sm text-slate-500"> / {visit.rides.length}</span></p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "visits.totalLaps")}</p><p className="mt-1 text-2xl font-bold text-amber-300">{totalLaps}</p></div></div><button type="button" onClick={save} disabled={isPending} className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950">{isPending ? "…" : translate(locale, "visits.saveVisit")}</button></div></header>;
}
