"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

type ParksFilterBarProps = {
  query: string;
  status: "ALL" | "WISHLIST" | "PLANNED" | "VISITED";
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ParksFilterBarProps["status"]) => void;
  onOpenSearch: () => void;
};

export function ParksFilterBar({ query, status, onQueryChange, onStatusChange, onOpenSearch }: ParksFilterBarProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:flex-row">
      <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-slate-400">
        <Search size={17} aria-hidden />
         <span className="sr-only">{t("parks.filter")}</span>
         <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("parks.search")} className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" />
      </label>
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 text-sm text-slate-300">
        <SlidersHorizontal size={16} aria-hidden />
         <span className="sr-only">{t("parks.filterStatus")}</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ParksFilterBarProps["status"])} className="bg-transparent outline-none">
           <option value="ALL">{t("parks.allStatuses")}</option>
           <option value="WISHLIST">{t("parks.wishlist")}</option>
           <option value="PLANNED">{t("parks.planned")}</option>
           <option value="VISITED">{t("parks.visited")}</option>
        </select>
      </label>
       <button type="button" onClick={onOpenSearch} className="min-h-11 rounded-xl bg-amber-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-300">{t("parks.importOrAdd")}</button>
    </div>
  );
}
