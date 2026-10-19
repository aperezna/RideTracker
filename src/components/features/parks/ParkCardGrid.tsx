import Link from "next/link";
import type { ParkCardData } from "@/core/domain/park-views";

const statusStyles = {
  WISHLIST: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  PLANNED: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  VISITED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
} as const;

export function ParkCardGrid({ parks }: { parks: ParkCardData[] }) {
  if (parks.length === 0) return <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No parks match this filter yet.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {parks.map((park) => (
        <Link key={park.id} href={`/parks/${park.id}`} className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:border-amber-400/50">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">{park.city}, {park.country}</p><h2 className="mt-2 text-xl font-bold text-slate-100 group-hover:text-amber-200">{park.name}</h2></div>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold tracking-wider ${statusStyles[park.status]}`}>{park.status}</span>
          </div>
          <p className="mt-5 min-h-10 text-sm leading-5 text-slate-400">{park.tripNotes || "No trip notes yet."}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{park.rideCount} rides catalogued</p>
        </Link>
      ))}
    </div>
  );
}
