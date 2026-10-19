"use client";

import { Search, SlidersHorizontal } from "lucide-react";

type ParksFilterBarProps = {
  query: string;
  status: "ALL" | "WISHLIST" | "PLANNED" | "VISITED";
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ParksFilterBarProps["status"]) => void;
  onOpenSearch: () => void;
};

export function ParksFilterBar({ query, status, onQueryChange, onStatusChange, onOpenSearch }: ParksFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:flex-row">
      <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-slate-400">
        <Search size={17} aria-hidden />
        <span className="sr-only">Filter parks</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search your parks" className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
      </label>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-sm text-slate-300">
        <SlidersHorizontal size={16} aria-hidden />
        <span className="sr-only">Filter by status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ParksFilterBarProps["status"])} className="bg-transparent outline-none">
          <option value="ALL">All statuses</option>
          <option value="WISHLIST">Wishlist</option>
          <option value="PLANNED">Planned</option>
          <option value="VISITED">Visited</option>
        </select>
      </label>
      <button type="button" onClick={onOpenSearch} className="min-h-11 rounded-xl bg-amber-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-300">Import or add park</button>
    </div>
  );
}
