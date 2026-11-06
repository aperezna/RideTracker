"use client";

import { useState, useTransition } from "react";
import { refreshParkCatalog, updateParkStatus, updateParkTripNotes } from "@/actions/park.actions";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { statusTranslationKey } from "@/core/i18n/translations";
import type { ParkDetailData } from "@/core/domain/park-views";

export function ParkHeroHeader({ park }: { park: ParkDetailData }) {
  const [notes, setNotes] = useState(park.tripNotes);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const { t } = useLocale();

  function saveNotes() {
    startTransition(async () => { await updateParkTripNotes(park.id, notes); setMessage(t("parks.notesSaved")); });
  }

  function changeStatus(status: ParkDetailData["status"]) {
    startTransition(async () => { await updateParkStatus(park.id, status); setMessage(t("parks.statusUpdated")); });
  }

  function syncCatalog() {
    if (!park.externalId) return;
    startTransition(async () => {
      try { await refreshParkCatalog(park.externalId!); setSyncMessage(t("parks.catalogSynced")); } catch { setSyncMessage(t("parks.catalogSyncFailed")); }
    });
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{park.city}, {park.country}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{park.name}</h1><p className="mt-2 text-sm text-slate-400">{t("parks.rides", { count: park.rideCount })} · {t("parks.visitDays", { count: park.visits.length })}</p></div>
        <div className="flex flex-col items-stretch gap-3"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("parks.status")}<select value={park.status} onChange={(event) => changeStatus(event.target.value as ParkDetailData["status"])} disabled={isPending} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"><option value="WISHLIST">{t(statusTranslationKey("WISHLIST"))}</option><option value="PLANNED">{t(statusTranslationKey("PLANNED"))}</option><option value="VISITED">{t(statusTranslationKey("VISITED"))}</option></select></label>{park.externalId ? <button type="button" onClick={syncCatalog} disabled={isPending} className="min-h-10 rounded-xl border border-cyan-400/40 px-3 text-xs font-bold text-cyan-300">{isPending ? t("parks.syncingCatalog") : t("parks.syncCatalog")}</button> : null}<span className="text-xs text-emerald-300" aria-live="polite">{syncMessage}</span></div>
      </div>
      <div className="mt-6"><label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("parks.tripNotes")}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-amber-400" placeholder={t("parks.addLogistics")} /></label><div className="mt-3 flex items-center justify-between"><span className="text-xs text-emerald-300" aria-live="polite">{message}</span><button type="button" disabled={isPending} onClick={saveNotes} className="min-h-11 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">{t("parks.saveNotes")}</button></div></div>
    </section>
  );
}
