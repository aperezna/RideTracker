export type WaitTimeHistoryPeriod = "24h" | "7d" | "all";

export type WaitTimeHistoryRecord = {
  waitMinutes: number | null;
  observedAt: Date | string;
  source?: string;
  isOpen?: boolean | null;
};

export type WaitTimeHistorySummary = {
  average: number | null;
  minimum: number | null;
  maximum: number | null;
};

export function filterWaitTimeHistory(records: WaitTimeHistoryRecord[], period: WaitTimeHistoryPeriod, now = new Date()): WaitTimeHistoryRecord[] {
  if (period === "all") return records;
  const threshold = now.getTime() - (period === "24h" ? 24 : 24 * 7) * 60 * 60 * 1000;
  return records.filter((record) => new Date(record.observedAt).getTime() >= threshold);
}

export function summarizeWaitTimeHistory(records: WaitTimeHistoryRecord[]): WaitTimeHistorySummary {
  const waits = records.map((record) => record.waitMinutes).filter((wait): wait is number => wait !== null);
  if (waits.length === 0) return { average: null, minimum: null, maximum: null };
  return {
    average: Math.round(waits.reduce((sum, wait) => sum + wait, 0) / waits.length),
    minimum: Math.min(...waits),
    maximum: Math.max(...waits),
  };
}
