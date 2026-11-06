import type { Metadata } from "next";
import "./globals.css";

import { AppNavigation } from "@/components/layout/AppNavigation";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getRequestLocale } from "@/core/i18n/server";
import { translate } from "@/core/i18n/translations";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: "RideTracker", description: translate(locale, "metadata.description"), applicationName: "RideTracker", appleWebApp: { capable: true, title: "RideTracker", statusBarStyle: "black-translucent" } };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}>
          <AppNavigation locale={locale} />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
