import { Activity, Globe2, MapPinned, Repeat2 } from "lucide-react";

type KpiStatsRowProps = {
  uniqueCoasterCount: number;
  visitedParks: number;
  plannedParks: number;
  wishlistParks: number;
  totalLaps: number;
  topCountry: string;
};

const cards = [
  { key: "coasters", label: "Coaster Count", icon: Activity, color: "text-amber-300" },
  { key: "parks", label: "Parks Progress", icon: MapPinned, color: "text-emerald-300" },
  { key: "laps", label: "Total Laps", icon: Repeat2, color: "text-cyan-300" },
  { key: "country", label: "Top Country", icon: Globe2, color: "text-violet-300" },
] as const;

export function KpiStatsRow(props: KpiStatsRowProps) {
  const values: Record<(typeof cards)[number]["key"], React.ReactNode> = {
    coasters: <><strong className="text-3xl text-amber-300">{props.uniqueCoasterCount}</strong><span> unique coasters</span></>,
    parks: <><strong className="text-3xl text-emerald-300">{props.visitedParks}</strong><span> visited / </span><strong className="text-3xl text-cyan-300">{props.wishlistParks + props.plannedParks}</strong><span> planned</span></>,
    laps: <><strong className="text-3xl text-cyan-300">{props.totalLaps}</strong><span> ride repetitions</span></>,
    country: <><strong className="text-3xl text-violet-300">{props.topCountry}</strong><span> most tracked</span></>,
  };

  return (
    <section aria-label="Dashboard key performance indicators" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <article key={key} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <Icon aria-hidden className={color} size={18} />
          </div>
          <p className="mt-5 text-sm text-slate-300">{values[key]}</p>
        </article>
      ))}
    </section>
  );
}
