"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getPendingRideCheckInCount, offlineQueueEventName } from "@/core/offline/ride-checkin-queue";

export function OfflineStatus() {
  const { t } = useLocale();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const refresh = () => { setOnline(navigator.onLine); void getPendingRideCheckInCount().then(setPending); };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener(offlineQueueEventName, refresh);
    return () => { window.removeEventListener("online", refresh); window.removeEventListener("offline", refresh); window.removeEventListener(offlineQueueEventName, refresh); };
  }, []);
  if (online && pending === 0) return null;
  return <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-200">{online ? t("offline.pending", { count: pending }) : t("offline.offline")}</span>;
}
