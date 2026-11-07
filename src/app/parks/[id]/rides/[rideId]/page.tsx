import { notFound } from "next/navigation";
import { getRequestLocale } from "@/core/i18n/server";
import { getRideDetailData } from "@/core/db/parks";
import { getRideEnrichment, translateEnrichmentText } from "@/core/services/wikimedia.service";
import { RideDetailCard } from "@/components/features/rides/RideDetailCard";

export const dynamic = "force-dynamic";

export default async function RideDetailPage({ params }: { params: Promise<{ id: string; rideId: string }> }) {
  const { id, rideId } = await params;
  const ride = getRideDetailData(id, rideId);
  if (!ride) notFound();
  const locale = await getRequestLocale();
  const liveEnrichment = await getRideEnrichment(ride.name, ride.parkName, locale);
  const persistedExperience = ride.experience ? await translateEnrichmentText(ride.experience, "en", locale) : null;
  const persistedStorytelling = ride.storytelling ? await translateEnrichmentText(ride.storytelling, "en", locale) : null;
  const enrichment = liveEnrichment ? {
    ...liveEnrichment,
    photoUrl: ride.photoUrl ?? liveEnrichment.photoUrl,
    sourceUrl: ride.photoSourceUrl ?? liveEnrichment.sourceUrl,
    experience: persistedExperience ?? liveEnrichment.experience,
    storytelling: persistedStorytelling ?? liveEnrichment.storytelling,
  } : ride.photoUrl ? {
    title: ride.name,
    experience: persistedExperience,
    storytelling: persistedStorytelling,
    photoUrl: ride.photoUrl,
    sourceUrl: ride.photoSourceUrl,
    manufacturer: null,
    category: null,
  } : null;
  return <RideDetailCard ride={ride} enrichment={enrichment} />;
}
