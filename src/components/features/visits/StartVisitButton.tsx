"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { recordVisitDay } from "@/actions/visit.actions";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function StartVisitButton({ parkId }: { parkId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useLocale();
  function startVisit() {
    startTransition(async () => {
      const visitId = await recordVisitDay({ parkId, visitDate: new Date().toISOString().slice(0, 10), tripNotes: null });
      router.push(`/visits/${visitId}`);
    });
  }
  return <button type="button" onClick={startVisit} disabled={isPending} className="min-h-11 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950">{isPending ? t("visits.active", { date: "…" }) : t("ride.startVisit")}</button>;
}
