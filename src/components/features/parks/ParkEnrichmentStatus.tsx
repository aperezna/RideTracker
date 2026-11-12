import { getRequestLocale } from "@/core/i18n/server";
import { summarizeEnrichmentStatus } from "@/core/domain/enrichment-status";
import { translate } from "@/core/i18n/translations";
import { RefreshEnrichmentButton } from "./RefreshEnrichmentButton";

export async function ParkEnrichmentStatus({ source, parkClosed, rideCount, observedAt }: { source: string | null; parkClosed: boolean | null; rideCount: number; observedAt: string | null }) {
  const locale = await getRequestLocale();
  const summary = summarizeEnrichmentStatus({ source, parkClosed, rideCount });
  const formattedObservedAt = observedAt ? new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(observedAt)) : translate(locale, "parks.enrichmentNoUpdate");
  const statusLabel = summary.availability === "CLOSED"
    ? translate(locale, "parks.enrichmentClosed")
    : summary.availability === "AVAILABLE"
      ? translate(locale, "parks.enrichmentAvailable")
      : translate(locale, "parks.enrichmentUnavailable");
  const statusClass = summary.availability === "CLOSED" ? "text-rose-300" : summary.availability === "AVAILABLE" ? "text-emerald-300" : "text-slate-400";

  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" aria-label={translate(locale, "parks.enrichmentTitle")}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{translate(locale, "parks.enrichmentTitle")}</p><h2 className="mt-1 text-xl font-bold">{translate(locale, "parks.enrichmentLiveStatus")}</h2></div><div className="flex flex-wrap items-center gap-3"><span className={`text-sm font-semibold ${statusClass}`}>{statusLabel}</span><RefreshEnrichmentButton /></div></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "parks.enrichmentSource")}</p><p className="mt-1 font-semibold text-slate-100">{summary.source ?? translate(locale, "parks.enrichmentNoSource")}</p></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "parks.enrichmentSignals")}</p><p className="mt-1 font-semibold text-slate-100">{translate(locale, "parks.rides", { count: summary.rideCount })}</p></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "parks.enrichmentUpdated")}</p><p className="mt-1 font-semibold text-slate-100">{formattedObservedAt}</p></div><div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><p className="text-xs uppercase tracking-wider text-slate-500">{translate(locale, "parks.enrichmentBoundary")}</p><p className="mt-1 text-slate-300">{translate(locale, "parks.enrichmentPublicOnly")}</p></div></div></section>;
}
