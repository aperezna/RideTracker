import { describe, expect, it } from "vitest";

import { filterWaitTimeHistory, summarizeWaitTimeHistory } from "../wait-time-history";

describe("wait-time history", () => {
  const now = new Date("2026-12-30T12:00:00.000Z");
  const records = [
    { waitMinutes: 10, observedAt: "2026-12-30T11:00:00.000Z" },
    { waitMinutes: 50, observedAt: "2026-12-28T12:00:00.000Z" },
    { waitMinutes: null, observedAt: "2026-12-20T12:00:00.000Z" },
  ];

  it("filters observations by period", () => {
    expect(filterWaitTimeHistory(records, "24h", now)).toHaveLength(1);
    expect(filterWaitTimeHistory(records, "7d", now)).toHaveLength(2);
    expect(filterWaitTimeHistory(records, "all", now)).toHaveLength(3);
  });

  it("summarizes reported wait values and ignores missing waits", () => {
    expect(summarizeWaitTimeHistory(records)).toEqual({ average: 30, minimum: 10, maximum: 50 });
    expect(summarizeWaitTimeHistory([{ waitMinutes: null, observedAt: now }])).toEqual({ average: null, minimum: null, maximum: null });
  });
});
