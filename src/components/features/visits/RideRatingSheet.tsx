"use client";

import { useState, useTransition } from "react";
import { updateRideRating } from "@/actions/ride.actions";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { translate } from "@/core/i18n/translations";
import type { VisitRideData } from "@/core/domain/park-views";

type RateableRide = Pick<VisitRideData, "id" | "name" | "rating" | "preferredRow" | "reviewNotes">;

export function RideRatingSheet({ ride }: { ride: RateableRide }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(ride.rating ?? 5);
  const [preferredRow, setPreferredRow] = useState(ride.preferredRow ?? "Front Row");
  const [notes, setNotes] = useState(ride.reviewNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const { locale } = useLocale();
  const rowOptions = [["Front Row", "visits.frontRow"], ["Back Row", "visits.backRow"], ["Middle", "visits.middleRow"], ["Custom", "visits.customRow"]] as const;
  function save() { startTransition(async () => { await updateRideRating({ rideId: ride.id, rating, preferredRow, reviewNotes: notes }); setOpen(false); }); }
  return <>{<button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-amber-300">{translate(locale, "visits.rateRide")}</button>}{open && <div role="dialog" aria-modal="true" aria-label={`${translate(locale, "visits.rateRide")} ${ride.name}`} className="fixed inset-0 z-50 flex items-end bg-slate-950/80"><div className="w-full rounded-t-3xl border border-slate-700 bg-slate-900 p-5 pb-8 shadow-2xl sm:mx-auto sm:max-w-xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-300">{translate(locale, "visits.rideReview")}</p><h2 className="mt-1 text-xl font-bold">{ride.name}</h2></div><button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-400">{translate(locale, "parks.close")}</button></div><label className="mt-6 block text-sm text-slate-300">{translate(locale, "visits.rating")} <output className="float-right font-mono text-amber-300">{rating.toFixed(1)} / 10</output><input type="range" min="1" max="10" step="0.5" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-3 w-full accent-amber-400" /></label><fieldset className="mt-6"><legend className="text-sm text-slate-300">{translate(locale, "parks.preferredRow")}</legend><div className="mt-2 flex flex-wrap gap-2">{rowOptions.map(([row, key]) => <button key={row} type="button" onClick={() => setPreferredRow(row)} className={`rounded-full border px-3 py-2 text-xs ${preferredRow === row ? "border-amber-300 bg-amber-400/20 text-amber-200" : "border-slate-700 text-slate-400"}`}>{translate(locale, key)}</button>)}</div></fieldset><label className="mt-6 block text-sm text-slate-300">{translate(locale, "visits.rideNotes")}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" placeholder={translate(locale, "visits.remember")} /></label><button type="button" onClick={save} disabled={isPending} className="mt-5 min-h-11 w-full rounded-xl bg-amber-400 font-bold text-slate-950">{translate(locale, "visits.saveReview")}</button></div></div>}</>;
}
