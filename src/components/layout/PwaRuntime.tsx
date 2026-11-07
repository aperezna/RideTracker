"use client";

import { useEffect } from "react";
import { syncPendingRideCheckIns } from "@/core/offline/ride-checkin-queue";

export function PwaRuntime(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    void syncPendingRideCheckIns();
    const sync = () => { void syncPendingRideCheckIns(); };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
  return null;
}
