"use client";

import nextDynamic from "next/dynamic";

import type { CountrySummary, DomainPark } from "@/core/domain/dashboard-stats";

const LeafletParksMap = nextDynamic(() => import("./LeafletParksMap"), {
  ssr: false,
  loading: () => <div className="flex h-72 w-full items-center justify-center bg-slate-950 text-sm text-slate-500">Loading map…</div>,
});

type ParksWorldMapProps = { parks: DomainPark[]; countries: CountrySummary[] };

export function ParksWorldMap({ parks, countries }: ParksWorldMapProps) {
  return (
    <section aria-labelledby="parks-map-title" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Geography</p>
          <h2 id="parks-map-title" className="mt-1 text-xl font-semibold text-slate-100">Parks by country</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{parks.length} marked</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <LeafletParksMap parks={parks} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Country summary">
        {countries.length === 0 ? (
          <span className="text-sm text-slate-400">Country summaries appear after adding parks.</span>
        ) : (
          countries.map((summary) => (
            <span key={summary.country} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-200">
              {summary.country} <strong className="text-emerald-300">{summary.visited}</strong>
              <span className="text-slate-500"> / {summary.total}</span>
            </span>
          ))
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Visited</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Planned</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />Wishlist</span>
      </div>
    </section>
  );
}
