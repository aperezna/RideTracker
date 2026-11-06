import type { MetadataRoute } from "next";
import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getRequestLocale();
  return {
    name: translate(locale, "metadata.manifestName"),
    short_name: "RideTracker",
    description: translate(locale, "metadata.manifestDescription"),
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
