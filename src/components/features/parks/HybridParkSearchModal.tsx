"use client";

import { useState, useTransition } from "react";
import { createPark, importPark, searchParks } from "@/actions/park.actions";
import type { ImportedPark } from "@/core/services/queue-times.service";

type HybridParkSearchModalProps = { open: boolean; onClose: () => void };

export function HybridParkSearchModal({ open, onClose }: HybridParkSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImportedPark[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  if (!open) return null;

  function search() {
    setError(null);
    startTransition(async () => {
      try { setResults(await searchParks(query)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Search failed"); }
    });
  }

  function importResult(externalId: string) {
    startTransition(async () => {
      try { await importPark(externalId); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Import failed"); }
    });
  }

  function createManual(formData: FormData) {
    startTransition(async () => {
      try {
        await createPark({ name: formData.get("name"), country: formData.get("country"), city: formData.get("city"), latitude: formData.get("latitude"), longitude: formData.get("longitude"), status: "WISHLIST", tripNotes: formData.get("tripNotes") ?? "" });
        onClose();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create park"); }
    });
  }

  return <div role="dialog" aria-modal="true" aria-label="Add park" className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-4 sm:items-center"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Hybrid catalog</p><h2 className="mt-2 text-2xl font-bold">Import or add a park</h2></div><button type="button" onClick={onClose} className="text-slate-400 hover:text-white">Close</button></div><div className="mt-6 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="Search Queue-Times" className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none" /><button type="button" onClick={search} disabled={isPending} className="rounded-xl bg-cyan-400 px-4 font-bold text-slate-950">Search</button></div><div className="mt-4 space-y-2">{results.map((park) => <div key={park.externalId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 p-3"><div><p className="font-semibold">{park.name}</p><p className="text-xs text-slate-400">{park.city}, {park.country}</p></div><button type="button" onClick={() => importResult(park.externalId)} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950">Import</button></div>)}</div><form action={createManual} className="mt-8 grid gap-3 border-t border-slate-800 pt-6 sm:grid-cols-2"><h3 className="sm:col-span-2 text-lg font-semibold">Add manually</h3>{[["name","Park name"],["country","Country"],["city","City"],["latitude","Latitude"],["longitude","Longitude"]].map(([name, label]) => <label key={name} className="text-xs text-slate-400">{label}<input name={name} required className="mt-1 min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" /></label>)}<label className="sm:col-span-2 text-xs text-slate-400">Trip notes<textarea name="tripNotes" className="mt-1 min-h-20 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100" /></label><button type="submit" disabled={isPending} className="sm:col-span-2 min-h-11 rounded-xl bg-amber-400 font-bold text-slate-950">Create park</button></form>{error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}</div></div>;
}
