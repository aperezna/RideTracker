import Image from "next/image";
import Link from "next/link";
import { getRequestLocale } from "@/core/i18n/server";
import { categoryTranslationKey, translate } from "@/core/i18n/translations";
import type { RideDetailData } from "@/core/domain/park-views";
import type { RideEnrichment } from "@/core/services/wikimedia.service";
import type { ReactElement } from "react";
import { RideEnrichmentEditor } from "./RideEnrichmentEditor";
import { RideRatingSheet } from "@/components/features/visits/RideRatingSheet";
import { StartVisitButton } from "@/components/features/visits/StartVisitButton";

const sourceFieldKeys = {
  category: "ride.sourceField.category",
  photo: "ride.sourceField.photo",
  experience: "ride.sourceField.experience",
  storytelling: "ride.sourceField.storytelling",
} as const;

function sourceFieldLabel(field: string, locale: Parameters<typeof translate>[0]): string {
  const key = sourceFieldKeys[field as keyof typeof sourceFieldKeys];
  return key ? translate(locale, key) : field;
}

export async function RideDetailCard({ ride, enrichment }: { ride: RideDetailData; enrichment: RideEnrichment | null }): Promise<ReactElement> {
  const locale = await getRequestLocale();
  const manufacturer = enrichment?.manufacturer || ride.manufacturer || translate(locale, "parks.manufacturerUnknown");
  return <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12"><div className="mx-auto max-w-5xl"><Link href={`/parks/${ride.parkId}`} className="text-sm text-slate-400 hover:text-amber-200">{translate(locale, "ride.backToPark")}</Link><section className="mt-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl"><div className="grid gap-0 lg:grid-cols-[1fr_1.15fr]">{enrichment?.photoUrl ? <Image src={enrichment.photoUrl} alt={translate(locale, "ride.photoAlt", { ride: ride.name })} width={900} height={600} className="h-full min-h-72 w-full object-cover" unoptimized /> : <div className="flex min-h-72 items-center justify-center bg-slate-950 text-sm text-slate-500">{translate(locale, "ride.photoUnavailable")}</div>}<div className="p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{translate(locale, "ride.details")}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{ride.name}</h1><p className="mt-2 text-sm text-slate-400">{ride.parkName} · {ride.parkCity}, {ride.parkCountry}</p><dl className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-950/60 p-3"><dt className="text-slate-500">{translate(locale, "parks.category")}</dt><dd className="mt-1 font-semibold">{translate(locale, categoryTranslationKey(ride.category))}</dd></div><div className="rounded-xl bg-slate-950/60 p-3"><dt className="text-slate-500">{translate(locale, "parks.manufacturerUnknown")}</dt><dd className="mt-1 font-semibold">{manufacturer}</dd></div><div className="rounded-xl bg-slate-950/60 p-3"><dt className="text-slate-500">{translate(locale, "ride.totalTrips")}</dt><dd className="mt-1 font-semibold text-cyan-300">{ride.totalTrips}</dd></div><div className="rounded-xl bg-slate-950/60 p-3"><dt className="text-slate-500">{translate(locale, "ride.totalLaps")}</dt><dd className="mt-1 font-semibold text-cyan-300">{ride.totalLaps}</dd></div></dl>{ride.fieldSources.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{ride.fieldSources.map((source) => <a key={`${source.field}-${source.source}`} href={source.sourceUrl ?? "#"} className="rounded-full border border-cyan-900 px-2 py-1 text-xs text-cyan-300">{sourceFieldLabel(source.field, locale)}: {source.source}</a>)}</div> : null}<div className="mt-6 flex flex-wrap gap-3"><StartVisitButton parkId={ride.parkId} /><RideRatingSheet ride={ride} /></div></div></div></section><RideEnrichmentEditor ride={{ ...ride, manufacturer }} /></div></main>;
}
