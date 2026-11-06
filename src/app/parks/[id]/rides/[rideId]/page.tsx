import { notFound } from "next/navigation";
import { getRequestLocale } from "@/core/i18n/server";
import { getRideDetailData } from "@/core/db/parks";
import { getRideEnrichment } from "@/core/services/wikimedia.service";
import { RideDetailCard } from "@/components/features/rides/RideDetailCard";

export const dynamic = "force-dynamic";

export default async function RideDetailPage({ params }: { params: Promise<{ id: string; rideId: string }> }) {
  const { id, rideId } = await params;
  const ride = getRideDetailData(id, rideId);
  if (!ride) notFound();
  const locale = await getRequestLocale();
  const enrichment = await getRideEnrichment(ride.name, ride.parkName, locale);
  return <RideDetailCard ride={ride} enrichment={enrichment} />;
}
