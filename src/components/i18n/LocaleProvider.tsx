"use client";

import { createContext, useContext, useState } from "react";
import { localeCookieName, translate, type Locale, type TranslationKey, type TranslationValues } from "@/core/i18n/translations";

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey, values?: TranslationValues) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [currentLocale, setCurrentLocale] = useState(locale);
  function setLocale(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setCurrentLocale(nextLocale);
  }
  return <LocaleContext.Provider value={{ locale: currentLocale, setLocale, t: (key, values) => translate(currentLocale, key, values) }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
