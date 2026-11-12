"use client";

import { useState } from "react";

import { translate, type Locale, type TranslationKey } from "@/core/i18n/translations";

type ImportCenterProps = { locale: Locale };
type ImportSummary = { parks: number; rides: number; visitDays: number; rideLogs: number; duplicates: number };
type ImportResponse = { summary?: ImportSummary; imported?: ImportSummary; warnings?: string[]; errors?: string[]; error?: string };

const summaryLabels: Record<keyof ImportSummary, TranslationKey> = {
  parks: "import.summaryParks",
  rides: "import.summaryRides",
  visitDays: "import.summaryVisitDays",
  rideLogs: "import.summaryRideLogs",
  duplicates: "import.summaryDuplicates",
};

function translateImportMessage(locale: Locale, message: string): string {
  if (message === "Import failed") return translate(locale, "import.failed");
  if (message === "Import contains validation errors") return translate(locale, "import.validationFailed");
  const countryError = message.match(/^Row (\d+): country is required because multiple parks have this name\.$/);
  return countryError ? translate(locale, "import.rowCountryRequired", { row: countryError[1] }) : message;
}

export function ImportCenter({ locale }: ImportCenterProps) {
  const t = (key: TranslationKey) => translate(locale, key);
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function selectFile(file: File | undefined): Promise<void> {
    if (!file) return;
    setFormat(file.name.toLowerCase().endsWith(".json") ? "json" : "csv");
    setContent(await file.text());
    setResult(null);
  }

  async function submit(mode: "preview" | "apply"): Promise<void> {
    if (!content) {
      setResult({ error: t("import.noFile") });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, mode, content }),
      });
      setResult((await response.json()) as ImportResponse);
    } catch {
      setResult({ error: t("import.failed") });
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary ?? result?.imported;
  const hasErrors = Boolean(result?.errors?.length);
  const completed = Boolean(result?.imported);

  return (
    <main className="min-h-screen bg-[#0f131d] px-4 py-6 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">RideTracker</p>
          <h1 className="mt-2 text-3xl font-bold">{t("import.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{t("import.description")}</p>
        </header>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <label className="block text-sm font-medium text-slate-200" htmlFor="import-file">
            {t("import.file")}
            <input id="import-file" type="file" accept=".csv,.json,text/csv,application/json" onChange={(event) => { void selectFile(event.target.files?.[0]); }} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300" />
          </label>
          <p className="mt-3 text-xs text-slate-500">{t("import.chooseFile")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => { void submit("preview"); }} disabled={loading || !content} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? t("import.loading") : t("import.preview")}</button>
            <button type="button" onClick={() => { void submit("apply"); }} disabled={loading || !content || !summary || hasErrors} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{t("import.apply")}</button>
          </div>
        </section>
        {result?.error ? <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200" role="alert">{translateImportMessage(locale, result.error)}</p> : null}
        {summary ? <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-lg font-semibold">{completed ? t("import.success") : t("import.summary")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(summary).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-950 p-3"><dt className="text-xs uppercase tracking-wider text-slate-500">{t(summaryLabels[key as keyof ImportSummary])}</dt><dd className="mt-1 text-xl font-bold text-cyan-300">{value}</dd></div>)}
          </dl>
          {result?.errors?.length ? <div className="mt-5"><h3 className="text-sm font-semibold text-rose-300">{t("import.errors")}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-200">{result.errors.map((error) => <li key={error}>{translateImportMessage(locale, error)}</li>)}</ul></div> : null}
          {result?.warnings?.length ? <div className="mt-5"><h3 className="text-sm font-semibold text-amber-300">{t("import.duplicates")}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">{result.warnings.map((warning) => <li key={warning}>{translateImportMessage(locale, warning)}</li>)}</ul></div> : null}
        </section> : null}
      </div>
    </main>
  );
}
