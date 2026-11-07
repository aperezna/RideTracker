"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePark } from "@/actions/park.actions";
import type { ParkCardData } from "@/core/domain/park-views";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { statusTranslationKey } from "@/core/i18n/translations";

const statusStyles = {
  WISHLIST: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  PLANNED: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  VISITED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
} as const;

export function ParkCardGrid({ parks }: { parks: ParkCardData[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [pendingParkId, setPendingParkId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  if (parks.length === 0) return <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">{t("parks.noMatch")}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {parks.map((park) => (
        <article key={park.id} className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:border-amber-400/50">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/parks/${park.id}`} className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{park.city}, {park.country}</p><h2 className="mt-2 text-xl font-bold text-slate-100 group-hover:text-amber-200">{park.name}</h2></Link>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold tracking-wider ${statusStyles[park.status]}`}>{t(statusTranslationKey(park.status))}</span>
          </div>
          <Link href={`/parks/${park.id}`}><p className="mt-5 min-h-10 text-sm leading-5 text-slate-400">{park.tripNotes || t("parks.noNotes")}</p><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("parks.ridesCatalogued", { count: park.rideCount })}</p></Link>
          {pendingParkId === park.id ? <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3"><p className="text-xs text-rose-200">{t("parks.deleteConfirm")}</p><div className="mt-3 flex gap-2"><button type="button" disabled={isPending} onClick={() => startTransition(async () => { await deletePark(park.id); setPendingParkId(null); router.refresh(); })} className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold text-slate-950">{isPending ? t("parks.deleting") : t("parks.deleteConfirmAction")}</button><button type="button" disabled={isPending} onClick={() => setPendingParkId(null)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-200">{t("parks.deleteCancel")}</button></div></div> : <button type="button" onClick={() => setPendingParkId(park.id)} className="mt-5 text-xs font-semibold text-rose-300 hover:text-rose-200">{t("parks.delete")}</button>}
        </article>
      ))}
    </div>
  );
}
