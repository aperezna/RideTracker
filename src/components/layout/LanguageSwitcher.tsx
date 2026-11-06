"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { locales, type Locale } from "@/core/i18n/translations";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const { t, setLocale } = useLocale();
  function changeLocale(nextLocale: string) {
    if (!locales.includes(nextLocale as Locale)) return;
    setLocale(nextLocale as Locale);
    router.refresh();
  }
  return <label className="ml-2 text-xs text-slate-400"><span className="sr-only">{t("language.select")}</span><select aria-label={t("language.label")} value={locale} onChange={(event) => changeLocale(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-slate-200 outline-none"><option value="en">{t("language.english")}</option><option value="es">{t("language.spanish")}</option></select></label>;
}
