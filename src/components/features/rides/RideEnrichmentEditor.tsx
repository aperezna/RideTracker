"use client";

import { useState, type ReactElement } from "react";
import { updateRideEnrichment } from "@/actions/ride.actions";
import type { RideDetailData } from "@/core/domain/park-views";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function RideEnrichmentEditor({ ride }: { ride: RideDetailData }): ReactElement {
  const { t } = useLocale();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData): Promise<void> {
    setPending(true);
    setMessage("");
    try {
      await updateRideEnrichment({
        rideId: ride.id,
        ...(formData.get("categoryEnabled") ? { category: String(formData.get("category")) as RideDetailData["category"] } : {}),
        ...(formData.get("manufacturerEnabled") ? { manufacturer: String(formData.get("manufacturer") ?? "") } : {}),
        ...(formData.get("experienceEnabled") ? { experience: String(formData.get("experience") ?? "") } : {}),
        ...(formData.get("storytellingEnabled") ? { storytelling: String(formData.get("storytelling") ?? "") } : {}),
      });
      setMessage(t("ride.manualSaved"));
    } catch {
      setMessage(t("ride.manualSaveFailed"));
    } finally {
      setPending(false);
    }
  }
  return <form action={submit} className="mt-8 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-sm font-semibold">{t("ride.manualCorrections")}</p><label className="block text-xs text-slate-400"><input type="checkbox" name="categoryEnabled" className="mr-2" />{t("ride.manualCategory")}<select name="category" defaultValue={ride.category} aria-label={t("ride.manualCategory")} className="ml-2 rounded-lg bg-slate-900 p-2 text-sm"><option value="COASTER">{t("ride.manualCategoryCoaster")}</option><option value="WATER">{t("ride.manualCategoryWater")}</option><option value="DARK_RIDE">{t("ride.manualCategoryDarkRide")}</option><option value="FLAT_RIDE">{t("ride.manualCategoryFlatRide")}</option><option value="SHOW">{t("ride.manualCategoryShow")}</option><option value="UNKNOWN">{t("ride.manualCategoryUnknown")}</option></select></label><label className="block text-xs text-slate-400"><input type="checkbox" name="manufacturerEnabled" className="mr-2" />{t("ride.manualManufacturer")}<input name="manufacturer" defaultValue={ride.manufacturer} placeholder={t("ride.manualManufacturerPlaceholder")} className="mt-1 w-full rounded-lg bg-slate-900 p-2 text-sm" /></label><label className="block text-xs text-slate-400"><input type="checkbox" name="experienceEnabled" className="mr-2" />{t("ride.manualExperience")}<textarea name="experience" defaultValue={ride.experience ?? ""} placeholder={t("ride.manualExperiencePlaceholder")} className="mt-1 min-h-20 w-full rounded-lg bg-slate-900 p-2 text-sm" /></label><label className="block text-xs text-slate-400"><input type="checkbox" name="storytellingEnabled" className="mr-2" />{t("ride.manualStorytelling")}<textarea name="storytelling" defaultValue={ride.storytelling ?? ""} placeholder={t("ride.manualStorytellingPlaceholder")} className="mt-1 min-h-20 w-full rounded-lg bg-slate-900 p-2 text-sm" /></label><button type="submit" disabled={pending} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{pending ? t("ride.manualSaving") : t("ride.manualSave")}</button>{message ? <span className="ml-3 text-xs text-slate-400">{message}</span> : null}</form>;
}
