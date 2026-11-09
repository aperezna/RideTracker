"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLocale();
  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return <button type="button" onClick={logout} className="rounded-lg px-2 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3">{t("navigation.signOut")}</button>;
}
