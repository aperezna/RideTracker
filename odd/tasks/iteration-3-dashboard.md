# RideTracker Iteration 3 Command Center Dashboard
Branch: `iteration-3-dashboard`
Delivery: one atomic UI work unit
Test runner: `npm run typecheck`, `npm run lint`, `npm run test`

## Specs

1. **S1 — UI-01 and RF-06**
   - "`[UI-01] Command Center Dashboard:` Componentes puros `<KpiStatsRow/>`, `<ParksWorldMap/>` (cargado con `next/dynamic` `ssr: false`) y `<TopRidesLeaderboard/>` (incluye badge de `preferredRow`)."
   - "`[RF-06] Dashboard Analítico y Mapa por País:` Vista principal con KPIs (Parques Visitados vs Wishlist/Planned, Coaster Count único vs Total Laps), Top 10 Atracciones (mostrando `rating` y `preferredRow`) y Mapa interactivo con marcadores diferenciados por estado y agrupados por país."
   - Criterion: "Given la carga de `/` When existen datos en SQLite Then renderiza KPIs exactos, Top 10 y mapa interactivo en < 200ms."

2. **S2 — Stitch handoff**
   - "Toma el diseño de `[UI-01]` (o el HTML/JSX exportado de Google Stitch si te lo adjunto) y desacoplalo estrictamente en `src/components/features/dashboard/`."
   - Handoff source: `C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard\code.html`.
   - Required components: `<KpiStatsRow/>`, `<TopRidesLeaderboard/>`, and `<ParksWorldMap/>` with dark visual language, emerald/amber/cyan status pins, and country summary bar.

3. **S3 — Server boundary**
   - "Conecta `src/app/page.tsx` como Server Component contenedor que consulta Drizzle y pasa props tipadas a los componentes presentacionales."
   - Components under `src/components/features/**` must not import `db` or call `fetch`; data enters through typed props.

4. **S4 — Library and delivery**
   - "CONSULTA CONTEXT7: Verifica con Context7 el uso de `react-leaflet` con carga dinámica (`next/dynamic` con `ssr: false`) en Next.js 15 App Router."
   - "VERIFICACIÓN Y GGA: Ejecuta `npm run typecheck`, `npm run lint` y `npm run test`. Pasa `gga` y haz commit `feat(ui): implement command center dashboard, top 10 and parks map`."
   - "ENGRAM CHECKPOINT: Registra en Engram la finalización de `[UI-01]` y `[RF-06]`."

## Tasks

- T1 — S1-S2 — inline — done (components + dark visual language)
- T2 — S3-S4 — inline — done (server boundary, checks, GGA passed)

## Log

- L1 — User request (2026-10-17):
  "Recupera el contexto de Engram y revisa `[UI-01]` y `[RF-06]` en SPEC.md. Vamos a implementar la Iteración 3 (Command Center Dashboard):
1. CONSULTA CONTEXT7: Verifica con Context7 el uso de `react-leaflet` con carga dinámica (`next/dynamic` con `ssr: false`) en Next.js 15 App Router.
2. IMPLEMENTACIÓN Y HANDOFF DE STITCH:
   - Toma el diseño de `[UI-01]` (o el HTML/JSX exportado de Google Stitch si te lo adjunto) y desacoplalo estrictamente en `src/components/features/dashboard/`:
     * `<KpiStatsRow/>`: Tarjetas para Coaster Count Único, Parques Visitados vs Wishlist/Planned, Total Laps y País Top.
     * `<TopRidesLeaderboard/>`: Lista del Top 10 mostrando ranking, nombre, parque, categoría, total de repeticiones, badge de `preferredRow` y puntuación sobre 10.
     * `<ParksWorldMap/>`: Mapa interactivo en modo oscuro con chinchetas esmeralda (`VISITED`), ámbar (`PLANNED`) y cian (`WISHLIST`), más barra de resumen por país.
   - Conecta `src/app/page.tsx` como Server Component contenedor que consulta Drizzle y pasa props tipadas a los componentes presentacionales.
3. VERIFICACIÓN Y GGA: Ejecuta `npm run typecheck`, `npm run lint` y `npm run test`. Pasa `gga` y haz commit `feat(ui): implement command center dashboard, top 10 and parks map`.
4. ENGRAM CHECKPOINT: Registra en Engram la finalización de `[UI-01]` y `[RF-06]`. En la siguiente ruta encontrarás el HTML de la pantalla: "C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard\code.html""
- L2 — Context7 confirmed React Leaflet is client-only because Leaflet touches the DOM; `MapContainer`, `TileLayer`, and `Marker` must remain inside a client component loaded with `next/dynamic` and `ssr: false`.
- L3 — Next.js 15 rejects `ssr: false` inside a Server Component (`ssr: false is not allowed with next/dynamic in Server Components`). Resolution: `ParksWorldMap.tsx` is a client component that performs the `next/dynamic({ ssr: false })` import of `LeafletParksMap.tsx`; `page.tsx` stays a Server Component and imports `ParksWorldMap` normally. Leaflet is absent from the main bundle (route `/` = 1.89 kB / 105 kB First Load JS).
- L4 — Added `src/components/features/dashboard/types.ts` so client components never import `@/core/db/*`; the DB module re-exports those view types.
- L5 — Evidence: `npm run typecheck` clean, `npm run lint` clean, `npm run test` 10/10 passed, `npm run build` succeeded with `/` as dynamic (ƒ).
- L6 — Blocker: `gga run --no-cache` failed with `Provider execution failed (exit code: 1)` / `The usage limit has been reached` (provider `opencode`, model `gpt-5.6-luna-fast`). Not a code defect; the review gate could not produce a verdict.
- L7 — `react-leaflet` + `leaflet` added as dependencies, `@types/leaflet` as devDependency.
- L8 — GGA could not produce a verdict (`usage limit has been reached` on `openai/gpt-5.6-luna-fast`). The user authorized changing GGA's provider/model. `.gga` now selects a tool-free primary OpenCode agent `gga-reviewer` (global config) pinned to `openrouter/~deepseek/deepseek-flash-latest`. The agent denies every tool, so the response starts with the `STATUS:` line GGA's STRICT_MODE requires.
- L9 — The first successful gate run reported three violations. Fixed all three: extracted the missing pure functions (`countParksByStatus`, `summarizeParksByCountry`, `topCountry`, `totalLaps`) into `src/core/domain/dashboard-stats.ts` with 8 new Vitest tests (RED -> GREEN), reused the existing `calculateTopTen` instead of duplicating its filter/sort/slice in the DB layer, and moved the view DTOs into `core/domain` so `src/core/db` no longer depends on `src/components` (deleted `src/components/features/dashboard/types.ts`).
- L10 — Fixed `eslint.config.mjs` to ignore `.next/**` build output and the generated `next-env.d.ts`. Running `next build` creates `.next/types/*.ts`, which had made `npm run lint` report 7095 bogus problems.
- L11 — Final evidence: `npm run typecheck` clean, `npm run lint` clean, `npm run test` 18/18 passed (3 files), `npm run build` succeeded, `gga run --no-cache` -> `STATUS: PASSED`.

## Risk

Risk: item 3 (the dashboard changes a public App Router page and its data boundary).
