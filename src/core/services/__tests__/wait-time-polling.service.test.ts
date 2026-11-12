import { describe, expect, it, vi } from "vitest";

import { pollWaitTimeObservations } from "../wait-time-polling.service";
import type { WaitTimePollingTarget } from "@/core/db/repositories";

const target = (userId: string): WaitTimePollingTarget => ({
  userId,
  parkId: `${userId}-park`,
  parkName: "Efteling",
  externalId: "123",
  rides: [{ id: `${userId}-ride`, externalId: "ride-1", name: "Baron 1898" }],
});

describe("wait-time polling", () => {
  it("deduplicates public provider requests while recording for each owner", async () => {
    const getThemeParksStatus = vi.fn().mockResolvedValue({ source: "ThemeParks.wiki", parkClosed: false, rides: { "ride-1": { isOpen: true, waitTime: 42 } }, ridesByName: { "baron 1898": { isOpen: true, waitTime: 42 } } });
    const recordWaitTimeSnapshots = vi.fn();

    await expect(pollWaitTimeObservations([target("user-1"), target("user-2")], {
      getThemeParksStatus,
      getQueueTimesStatus: vi.fn(),
      recordWaitTimeSnapshots,
    })).resolves.toEqual({ targets: 2, observations: 2 });

    expect(getThemeParksStatus).toHaveBeenCalledTimes(1);
    expect(recordWaitTimeSnapshots).toHaveBeenCalledTimes(2);
    expect(recordWaitTimeSnapshots).toHaveBeenCalledWith([{ rideId: "user-1-ride", source: "ThemeParks.wiki", waitMinutes: 42, isOpen: true }], "user-1");
  });

  it("falls back to Queue-Times and deduplicates the fallback request", async () => {
    const getThemeParksStatus = vi.fn().mockResolvedValue(null);
    const getQueueTimesStatus = vi.fn().mockResolvedValue({ parkClosed: false, rides: { "ride-1": { isOpen: false, waitTime: 0 } } });

    await expect(pollWaitTimeObservations([target("user-1"), target("user-2")], {
      getThemeParksStatus,
      getQueueTimesStatus,
      recordWaitTimeSnapshots: vi.fn(),
    })).resolves.toMatchObject({ targets: 2, observations: 2 });

    expect(getQueueTimesStatus).toHaveBeenCalledTimes(1);
  });
});
