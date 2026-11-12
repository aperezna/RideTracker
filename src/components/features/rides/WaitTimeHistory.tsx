import { getRequestLocale } from "@/core/i18n/server";
import type { WaitTimeHistoryPoint } from "@/core/db/parks";
import { WaitTimeHistoryChart } from "./WaitTimeHistoryChart";

export async function WaitTimeHistory({ observations }: { observations: WaitTimeHistoryPoint[] }) {
  const locale = await getRequestLocale();
  return <WaitTimeHistoryChart locale={locale} observations={observations.map((observation) => ({ ...observation, observedAt: observation.observedAt.toISOString() }))} />;
}
