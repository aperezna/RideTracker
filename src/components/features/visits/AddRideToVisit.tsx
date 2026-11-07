"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { VisitRideData } from "@/core/domain/park-views";

export function AddRideToVisit({ visitId, selectedRideIds, rides }: { visitId: string; selectedRideIds: string[]; rides: VisitRideData[] }) {
  const router = useRouter();
  const { t } = useLocale();
  const availableRides = rides.filter((ride) => !selectedRideIds.includes(ride.id));
  if (availableRides.length === 0) return null;
  return <label className="block rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/5 p-4 text-sm text-slate-300">{t("visits.addRide")}<select defaultValue="" onChange={(event) => { if (!event.target.value) return; const next = [...selectedRideIds, event.target.value]; router.push(`/visits/${visitId}?rideId=${next.map(encodeURIComponent).join(",")}`); }} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-slate-100"><option value="">{t("visits.selectRide")}</option>{availableRides.map((ride) => <option key={ride.id} value={ride.id}>{ride.name}</option>)}</select></label>;
}
