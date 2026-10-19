"use client";

import { useMemo, useState } from "react";
import type { ParkCardData } from "@/core/domain/park-views";
import { HybridParkSearchModal } from "./HybridParkSearchModal";
import { ParkCardGrid } from "./ParkCardGrid";
import { ParksFilterBar } from "./ParksFilterBar";

export function ParksCatalog({ parks }: { parks: ParkCardData[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "WISHLIST" | "PLANNED" | "VISITED">("ALL");
  const [searchOpen, setSearchOpen] = useState(false);
  const filtered = useMemo(() => parks.filter((park) => (status === "ALL" || park.status === status) && `${park.name} ${park.city} ${park.country}`.toLowerCase().includes(query.toLowerCase())), [parks, query, status]);
  return <><ParksFilterBar query={query} status={status} onQueryChange={setQuery} onStatusChange={setStatus} onOpenSearch={() => setSearchOpen(true)} /><div className="mt-5"><ParkCardGrid parks={filtered} /></div><HybridParkSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} /></>;
}
