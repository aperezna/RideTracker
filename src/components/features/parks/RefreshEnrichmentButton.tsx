"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useLocale } from "@/components/i18n/LocaleProvider";

export function RefreshEnrichmentButton() {
  const router = useRouter();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();

  return <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={isPending} className="min-h-10 rounded-xl border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300 disabled:cursor-wait disabled:opacity-60">{isPending ? t("parks.refreshingEnrichment") : t("parks.refreshEnrichment")}</button>;
}
