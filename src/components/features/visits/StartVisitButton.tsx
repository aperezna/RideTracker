"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordVisitDay } from "@/actions/visit.actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StartVisitButton({ parkId }: { parkId: string }) {
  const router = useRouter();
  const params = useParams<{ rideId?: string }>();
  const [isPending, startTransition] = useTransition();
  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [visitDate, setVisitDate] = useState(today);
  const { t } = useLocale();
  const currentRideId = params.rideId;

  function startVisit() {
    startTransition(async () => {
      const visitId = await recordVisitDay({ parkId, visitDate, tripNotes: null });
      const rideQuery = currentRideId ? `?rideId=${encodeURIComponent(currentRideId)}` : "";
      router.push(`/visits/${visitId}${rideQuery}`);
    });
  }

  if (isSelectingDate) {
    return <div className="flex flex-wrap items-center justify-end gap-2"><label className="text-xs text-slate-400">{t("ride.experienceDate")}<input type="date" value={visitDate} max={today()} onChange={(event) => setVisitDate(event.target.value)} className="ml-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100" /></label><button type="button" onClick={() => setIsSelectingDate(false)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300">{t("ride.cancel")}</button><button type="button" onClick={startVisit} disabled={isPending} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">{isPending ? "…" : t("ride.confirmExperience")}</button></div>;
  }

  return <button type="button" onClick={() => setIsSelectingDate(true)} disabled={isPending} className="min-h-11 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950">{t("ride.startVisit")}</button>;
}
