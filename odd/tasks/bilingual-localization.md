# Bilingual localization
Objective: make the RideTracker application available in English and Spanish.
Delivery: local Docker deployment for validation; no commit or push requested. Test runner: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Specs

1. **S1 — Supported locales and persistence**: User request: "quiero que la aplicación sea totalmente multilingue, de momento solo inglés y español." Acceptance: English and Spanish are supported; English is the default; the browser language is used on first visit when it is Spanish; a user-visible selector persists the choice in a locale cookie; invalid locale values fall back safely.
2. **S2 — Complete application copy**: Translate application-owned navigation, page headings, labels, buttons, placeholders, loading states, empty states, status values, accessibility labels, metadata, and presentation errors into both locales. Imported park, ride, country, and provider data remain in their source language.
3. **S3 — Server/client consistency**: Render the selected locale consistently in Server Components, Client Components, server actions, route handlers, and the document `lang` attribute without hydration mismatch.
4. **S4 — Validation and deployment**: Preserve existing behavior, add focused locale/translation coverage, run the applicable checks, rebuild the Docker image, and deploy the container so the user can validate both languages at `http://localhost:3000`.

## Tasks

- T1 (S1, S3): Add typed locale resolution, translation catalog access, cookie/browser fallback, document metadata, and language switching. Route: inline. Status: complete. Evidence: `src/core/i18n/*`, `src/components/i18n/LocaleProvider.tsx`, root layout and navigation; TypeScript and ESLint pass.
- T2 (S2): Replace user-visible application copy and presentation errors across the app with localized translations. Route: inline. Status: complete. Evidence: dashboard, login, parks, visits, map, modal, metadata, manifest, and accessibility copy now use the catalog.
- T3 (S4): Add focused tests, run validation, rebuild and deploy Docker. Route: inline. Status: complete. Evidence: Docker build passed; TypeScript, ESLint, and 24 Vitest tests passed; running container serves English and Spanish login pages on port 3000.

## Log

L1: "quiero que la aplicación sea totalmente multilingue, de momento solo inglés y español. haz lo cambios y vuelve a desplegar el docker para poder validar los cambios"
L2: Assumption accepted for implementation: application-owned UI and errors are translated; external entity names and imported provider data are not machine-translated.
L3: Initial implementation completed inline; focused locale tests were added before Docker validation.
L4: Docker image rebuilt and container redeployed successfully. Browser-language probes returned English copy for `en-US` and Spanish copy for `es-ES`; `<html lang>` matched each locale.
