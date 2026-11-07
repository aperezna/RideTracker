"use client";

import "leaflet/dist/leaflet.css";

import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import type { DomainPark } from "@/core/domain/dashboard-stats";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { statusTranslationKey } from "@/core/i18n/translations";

type LeafletParksMapProps = { parks: DomainPark[] };

const statusColors = { VISITED: "#34d399", PLANNED: "#fbbf24", WISHLIST: "#22d3ee" } as const;

export default function LeafletParksMap({ parks }: LeafletParksMapProps) {
  const { t } = useLocale();
  return (
    <MapContainer center={[30, 10]} zoom={2} minZoom={2} scrollWheelZoom className="h-72 w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {parks.map((park) => (
        <CircleMarker
          key={park.id}
          center={[park.latitude, park.longitude]}
          radius={park.status === "VISITED" ? 8 : 6}
          pathOptions={{ color: statusColors[park.status], fillColor: statusColors[park.status], fillOpacity: 0.85 }}
        >
          <Popup>
            <Link href={`/parks/${park.id}`}>
              <strong>{park.name}</strong>
            </Link>
            <br />
             {park.country} · {t(statusTranslationKey(park.status))}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
