import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { OfflineStatus } from "@/components/layout/OfflineStatus";
import { translate, type Locale } from "@/core/i18n/translations";
import { LogoutButton } from "@/components/layout/LogoutButton";

export function AppNavigation({ locale }: { locale: Locale }) {
  const links = [
    { href: "/", label: translate(locale, "navigation.dashboard") },
    { href: "/parks", label: translate(locale, "navigation.parks") },
  ] as const;

  return <nav aria-label={translate(locale, "navigation.main")} className="border-b border-slate-800 bg-[#0b0f17] px-4 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-7xl items-center justify-between gap-2 py-3"><Link className="text-sm font-bold tracking-wide text-slate-100" href="/">RideTracker</Link><div className="flex items-center gap-1 sm:gap-2"><OfflineStatus />{links.map((link) => <Link className="rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3" href={link.href} key={link.href}>{link.label}</Link>)}<LanguageSwitcher locale={locale} /><LogoutButton /></div></div></nav>;
}
