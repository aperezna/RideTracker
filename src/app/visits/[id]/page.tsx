import { notFound } from "next/navigation";
import { QuickRideCheckinCard } from "@/components/features/visits/QuickRideCheckinCard";
import { RideRatingSheet } from "@/components/features/visits/RideRatingSheet";
import { VisitDayHeader } from "@/components/features/visits/VisitDayHeader";
import { getVisitDayData } from "@/core/db/visits";

export const dynamic = "force-dynamic";

export default async function VisitDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = getVisitDayData(id);
  if (!visit) notFound();
  return <main className="min-h-screen bg-[#0f131d] px-4 py-6 pb-10 text-slate-100 sm:px-8"><div className="mx-auto max-w-2xl"><a href={`/parks/${visit.parkId}`} className="text-sm text-slate-400 hover:text-amber-200">← Park detail</a><div className="mt-5"><VisitDayHeader visit={visit} /></div><section className="mt-6 space-y-3"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Mobile check-in</p><h2 className="mt-1 text-xl font-bold">Ride queue</h2></div><span className="text-xs text-slate-500">Tap, ride, repeat</span></div>{visit.rides.map((ride) => <div key={ride.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><QuickRideCheckinCard visitDayId={visit.id} ride={ride} /><div className="mt-3 border-t border-slate-800 pt-3 text-right"><RideRatingSheet ride={ride} /></div></div>)}</section></div></main>;
}
