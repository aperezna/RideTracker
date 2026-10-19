"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import type { DomainPark } from "@/core/domain/dashboard-stats";

type LeafletParksMapProps = { parks: DomainPark[] };

const statusColors = { VISITED: "#34d399", PLANNED: "#fbbf24", WISHLIST: "#22d3ee" } as const;

export default function LeafletParksMap({ parks }: LeafletParksMapProps) {
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
            <strong>{park.name}</strong>
            <br />
            {park.country} · {park.status}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
