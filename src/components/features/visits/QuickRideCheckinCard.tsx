"use client";

import { startTransition, useOptimistic, useTransition } from "react";
import { recordRideCheckIn } from "@/actions/ride.actions";
import type { VisitRideData } from "@/core/domain/park-views";

type OptimisticState = { lapCount: number; checkInCount: number };
type OptimisticAction = { type: "lap"; delta: number } | { type: "check-in"; lapCount: number };

function reducer(state: OptimisticState, action: OptimisticAction): OptimisticState {
  if (action.type === "lap") return { ...state, lapCount: Math.max(1, state.lapCount + action.delta) };
  return { lapCount: 1, checkInCount: state.checkInCount + 1 };
}

export function QuickRideCheckinCard({ visitDayId, ride }: { visitDayId: string; ride: VisitRideData }) {
  const [state, dispatch] = useOptimistic<OptimisticState, OptimisticAction>({ lapCount: Math.max(1, ride.lapCount || 1), checkInCount: ride.checkInCount }, reducer);
  const [isPending, startTransitionForAction] = useTransition();
  function changeLaps(delta: number) { startTransition(() => dispatch({ type: "lap", delta })); }
  function checkIn() { const lapCount = state.lapCount; startTransitionForAction(async () => { dispatch({ type: "check-in", lapCount }); await recordRideCheckIn({ visitDayId, rideId: ride.id, status: "RIDDEN", lapCount, rowUsed: null, notes: null }); }); }
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-100">{ride.name}</h2><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{ride.category} · {ride.preferredRow ?? "Row not set"}</p></div><span className="text-xs text-cyan-300">{state.checkInCount} check-ins</span></div><div className="mt-5 flex items-center gap-3"><div className="flex items-center rounded-xl border border-slate-700 bg-slate-950"><button type="button" aria-label={`Decrease laps for ${ride.name}`} onClick={() => changeLaps(-1)} className="min-h-11 min-w-11 text-xl text-slate-300">−</button><span aria-live="polite" className="min-w-10 text-center font-mono text-lg text-amber-300">{state.lapCount}</span><button type="button" aria-label={`Increase laps for ${ride.name}`} onClick={() => changeLaps(1)} className="min-h-11 min-w-11 text-xl text-slate-300">+</button></div><button type="button" onClick={checkIn} disabled={isPending} className="min-h-11 flex-1 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-slate-950">+ Check-in</button></div></article>;
}
