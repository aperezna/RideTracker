import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideTracker — Theme Park & Ride Tracker",
    short_name: "RideTracker",
    description: "Track theme parks, ride check-ins, laps, ratings, and visit notes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f131d",
    theme_color: "#0f131d",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
