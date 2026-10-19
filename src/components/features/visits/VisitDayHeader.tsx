"use client";

import { useState, useTransition } from "react";
import { updateVisitDayNotes } from "@/actions/visit.actions";
import type { VisitDayData } from "@/core/domain/park-views";

export function VisitDayHeader({ visit }: { visit: VisitDayData }) {
  const [notes, setNotes] = useState(visit.tripNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const totalLaps = visit.rides.reduce((sum, ride) => sum + ride.lapCount, 0);
  const ridden = visit.rides.filter((ride) => ride.checkInCount > 0).length;
  function save() { startTransition(async () => { await updateVisitDayNotes(visit.id, notes); }); }
  return <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Active visit · {visit.visitDate}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{visit.parkName}</h1><p className="mt-2 text-sm text-slate-400">{visit.city}, {visit.country}</p></div><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">LIVE</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">Unique rides</p><p className="mt-1 text-2xl font-bold text-slate-100">{ridden}<span className="text-sm text-slate-500"> / {visit.rides.length}</span></p></div><div className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">Total laps</p><p className="mt-1 text-2xl font-bold text-amber-300">{totalLaps}</p></div><div className="col-span-2 rounded-xl bg-slate-950/60 p-3 sm:col-span-1"><label className="text-xs uppercase tracking-wider text-slate-500">Day notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-12 w-full resize-none bg-transparent text-sm text-slate-100 outline-none" placeholder="Weather, crowds, highlights..." /><button type="button" onClick={save} disabled={isPending} className="text-xs font-bold text-cyan-300">Save notes</button></label></div></div></header>;
}
