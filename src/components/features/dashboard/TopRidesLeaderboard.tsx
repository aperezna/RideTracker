import { Medal, Star } from "lucide-react";

import type { TopRideRow } from "@/core/domain/dashboard-stats";

type TopRidesLeaderboardProps = { rides: TopRideRow[] };

export function TopRidesLeaderboard({ rides }: TopRidesLeaderboardProps) {
  return (
    <section aria-labelledby="top-rides-title" className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Personal ranking</p>
          <h2 id="top-rides-title" className="mt-1 text-xl font-semibold text-slate-100">Top 10 favorite rides</h2>
        </div>
        <Medal aria-hidden className="text-amber-300" size={22} />
      </div>
      <div className="mt-5 space-y-2">
        {rides.length === 0 ? <p className="rounded-xl bg-slate-950/80 p-4 text-sm text-slate-400">Rate a ridden attraction to build your ranking.</p> : rides.map((ride, index) => (
          <article key={ride.id} className="flex items-center gap-3 rounded-xl bg-slate-950/70 p-3">
            <span className="w-8 text-center text-sm font-bold text-slate-500">#{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-semibold text-slate-100">{ride.name}</h3>
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 text-sm font-bold text-amber-300"><Star aria-hidden size={13} fill="currentColor" />{ride.rating.toFixed(1)}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-400">{ride.parkName} · {ride.category}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
              <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-cyan-300">×{ride.totalLaps}</span>
              <span className="max-w-24 truncate rounded-full bg-amber-400/10 px-2 py-1 text-amber-200" title={ride.preferredRow ?? "No preferred row"}>{ride.preferredRow ?? "Row —"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
