"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { translateError } from "@/core/i18n/translations";

export default function LoginPage() {
  const router = useRouter();
  const { locale, t, setLocale } = useLocale();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
         setError(result.error ? translateError(locale, new Error(result.error), "login.unable") : t("login.unable"));
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
       setError(t("login.tryAgain"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f131d] px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">RideTracker</p><label className="text-xs text-slate-400"><span className="sr-only">{t("language.select")}</span><select aria-label={t("language.label")} value={locale} onChange={(event) => setLocale(event.target.value as "en" | "es")} className="rounded border border-slate-700 bg-slate-950 px-2 py-1"><option value="en">{t("language.english")}</option><option value="es">{t("language.spanish")}</option></select></label></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{t("login.signIn")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("login.description")}</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
           <label className="block text-sm font-medium text-slate-200" htmlFor="email">
             {t("login.email")}
             <input autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-emerald-400" id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
           </label>
           <label className="block text-sm font-medium text-slate-200" htmlFor="password">
             {t("login.password")}
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-emerald-400"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="text-sm text-rose-300" role="alert">{error}</p> : null}

          <button
            className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
             {submitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">{t("login.registerPrompt")} <Link className="text-emerald-300 hover:text-emerald-200" href="/register">{t("login.registerLink")}</Link></p>
      </section>
    </main>
  );
}
