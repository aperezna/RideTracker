import type { WaitTimePollingTarget, WaitTimeSnapshot } from "@/core/db/repositories";
import { recordWaitTimeSnapshots } from "@/core/db/repositories";
import { getQueueTimesStatus, type QueueTimesStatus } from "./queue-times.service";
import { getThemeParksStatus, type ThemeParksStatus } from "./themeparks.service";

type PollingStatus = QueueTimesStatus | ThemeParksStatus;
type ThemeStatusFetcher = (parkName: string) => Promise<ThemeParksStatus | null>;
type QueueStatusFetcher = (externalId: string) => Promise<QueueTimesStatus | null>;

export type WaitTimePollingDependencies = {
  getThemeParksStatus: ThemeStatusFetcher;
  getQueueTimesStatus: QueueStatusFetcher;
  recordWaitTimeSnapshots: typeof recordWaitTimeSnapshots;
};

const defaultDependencies: WaitTimePollingDependencies = { getThemeParksStatus, getQueueTimesStatus, recordWaitTimeSnapshots };

function normalizeRideName(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function snapshotsForTarget(target: WaitTimePollingTarget, status: PollingStatus): WaitTimeSnapshot[] {
  const themeStatus = "ridesByName" in status ? status : null;
  return target.rides.flatMap((ride) => {
    const rideStatus = (ride.externalId ? status.rides[ride.externalId] : undefined) ?? (themeStatus ? themeStatus.ridesByName[normalizeRideName(ride.name)] : undefined);
    return rideStatus ? [{ rideId: ride.id, source: themeStatus?.source ?? "Queue-Times", waitMinutes: rideStatus.waitTime, isOpen: rideStatus.isOpen }] : [];
  });
}

export async function pollWaitTimeObservations(targets: WaitTimePollingTarget[], dependencies: WaitTimePollingDependencies = defaultDependencies): Promise<{ targets: number; observations: number }> {
  const themeStatuses = new Map<string, Promise<ThemeParksStatus | null>>();
  const queueStatuses = new Map<string, Promise<QueueTimesStatus | null>>();
  let observations = 0;
  for (const target of targets) {
    const themeKey = target.externalId ?? target.parkName.trim().toLowerCase();
    const themePromise = themeStatuses.get(themeKey) ?? dependencies.getThemeParksStatus(target.parkName);
    themeStatuses.set(themeKey, themePromise);
    let status: PollingStatus | null = await themePromise;
    if (!status && target.externalId) {
      const queuePromise = queueStatuses.get(target.externalId) ?? dependencies.getQueueTimesStatus(target.externalId);
      queueStatuses.set(target.externalId, queuePromise);
      status = await queuePromise;
    }
    if (!status) continue;
    const snapshots = snapshotsForTarget(target, status);
    if (snapshots.length === 0) continue;
    dependencies.recordWaitTimeSnapshots(snapshots, target.userId);
    observations += snapshots.length;
  }
  return { targets: targets.length, observations };
}
