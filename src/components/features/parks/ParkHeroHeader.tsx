"use client";

import { useState, useTransition } from "react";
import { updateParkStatus, updateParkTripNotes } from "@/actions/park.actions";
import type { ParkDetailData } from "@/core/domain/park-views";

export function ParkHeroHeader({ park }: { park: ParkDetailData }) {
  const [notes, setNotes] = useState(park.tripNotes);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveNotes() {
    startTransition(async () => { await updateParkTripNotes(park.id, notes); setMessage("Notes saved"); });
  }

  function changeStatus(status: ParkDetailData["status"]) {
    startTransition(async () => { await updateParkStatus(park.id, status); setMessage("Status updated"); });
  }

  return <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl sm:p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{park.city}, {park.country}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{park.name}</h1><p className="mt-2 text-sm text-slate-400">{park.rideCount} rides · {park.visits.length} visit days</p></div><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Park status<select value={park.status} onChange={(event) => changeStatus(event.target.value as ParkDetailData["status"])} disabled={isPending} className="mt-2 block min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"><option value="WISHLIST">Wishlist</option><option value="PLANNED">Planned</option><option value="VISITED">Visited</option></select></label></div><div className="mt-6"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trip notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder="Add logistics, plans or memories" /></label><div className="mt-3 flex items-center justify-between"><span className="text-xs text-emerald-300" aria-live="polite">{message}</span><button type="button" disabled={isPending} onClick={saveNotes} className="min-h-11 rounded-xl bg-amber-400 px-4 text-sm font-bold text-slate-950">Save notes</button></div></div></section>;
}
