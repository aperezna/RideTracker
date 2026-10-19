# RideTracker Iteration 4 Park, Detail, and Mobile Visit UI
Branch: `iteration-3-dashboard` (delivery strategy: chained commits)
Objective: implement `[UI-02]`, `[UI-03]`, `[UI-04]`, and `[RNF-01]` from `SPEC.md`.
Test runner: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `gga run --no-cache`
Forecast: above the default ~400 authored-line review slice; use chained commits by independent behavior.

## Specs

1. **S1 — Context7 and optimistic mutation**
   - "Usa Context7 para revisar el hook `useOptimistic` de React 19 junto con Server Actions en Next.js 15."
   - "`<QuickRideCheckinCard/>` utilizando `useOptimistic` para que el stepper `[- lapCount +]` y el botón `+ Check-in` respondan en 0ms desde el móvil."

2. **S2 — UI-02 catalog and hybrid search**
   - "En `src/components/features/parks/`:"
   - "Crea `<ParksFilterBar/>`, `<ParkCardGrid/>` (mostrando estado y extracto de `tripNotes`) y `<HybridParkSearchModal/>` conectado al servicio de Queue-Times y creación manual."
   - "Conecta las páginas `src/app/parks/page.tsx`..."

3. **S3 — UI-03 park detail**
   - "Crea `<ParkHeroHeader/>` (con edición de estado y `tripNotes` del parque), `<RideInventoryTable/>` (mostrando `preferredRow`, `rating` y conteo histórico) y `<VisitHistoryTimeline/>` (mostrando las jornadas de visita y sus `tripNotes`)."
   - "Conecta ... `src/app/parks/[id]/page.tsx` ..."

4. **S4 — UI-04 mobile visit**
   - "En `src/components/features/visits/` (Vista Mobile-First `[UI-04]`):"
   - "Crea `<VisitDayHeader/>` (con editor rápido de `tripNotes` de la jornada)."
   - "Crea `<QuickRideCheckinCard/>` utilizando `useOptimistic`..."
   - "Crea `<RideRatingSheet/>` (drawer inferior para ajustar `rating` 1.0-10.0, chips rápidos de `preferredRow`: Front Row, Back Row, Middle, Custom, y notas de la atracción)."
   - "Conecta ... `src/app/visits/[id]/page.tsx`."

5. **S5 — RDD verification boundary**
   - "Invoca un subagente verificador para comprobar que ningún componente en `src/components/features/**` importa `db` directamente y que `preferredRow` y `tripNotes` están presentes en todas las vistas requeridas por `SPEC.md`."

6. **S6 — verification, GGA, and checkpoint**
   - "Ejecuta `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build`. Audita con `gga` y haz commit `feat(ui): complete park detail, hybrid modal and optimistic mobile visit check-in`."
   - "Registra en Engram que todas las pantallas `[UI-01..04]` están operativas."
   - Stitch sources: `C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard (1)\code1.html` and `C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard (2)\code2.html`.

## Tasks

- T1 — S1-S2 — inline — done — catalog list, filters, hybrid search, manual creation; checks green; commit pending.
- T2 — S3 — inline — done — park detail data boundary and presentation components; checks green; commit pending.
- T3 — S4 — inline — done — mobile visit header, optimistic check-in, rating sheet; checks green; commit pending.
- T4 — S5 — delegated verifier — pending — RDD boundary and required field audit.
- T5 — S6 — inline — pending — checks, GGA, checkpoint, and requested commit.

## Log

- L1 — User request (2026-10-19):
  "Consulta Engram y revisa `[UI-02]`, `[UI-03]`, `[UI-04]` y `[RNF-01]` en SPEC.md. Vamos a ejecutar la Iteración 4:
1. CONSULTA CONTEXT7: Usa Context7 para revisar el hook `useOptimistic` de React 19 junto con Server Actions en Next.js 15.
2. IMPLEMENTACIÓN Y HANDOFF DE STITCH:
   - En `src/components/features/parks/`:
     * Crea `<ParksFilterBar/>`, `<ParkCardGrid/>` (mostrando estado y extracto de `tripNotes`) y `<HybridParkSearchModal/>` conectado al servicio de Queue-Times y creación manual.
     * Crea `<ParkHeroHeader/>` (con edición de estado y `tripNotes` del parque), `<RideInventoryTable/>` (mostrando `preferredRow`, `rating` y conteo histórico) y `<VisitHistoryTimeline/>` (mostrando las jornadas de visita y sus `tripNotes`).
   - En `src/components/features/visits/` (Vista Mobile-First `[UI-04]`):
     * Crea `<VisitDayHeader/>` (con editor rápido de `tripNotes` de la jornada).
     * Crea `<QuickRideCheckinCard/>` utilizando `useOptimistic` para que el stepper `[- lapCount +]` y el botón `+ Check-in` respondan en 0ms desde el móvil.
     * Crea `<RideRatingSheet/>` (drawer inferior para ajustar `rating` 1.0-10.0, chips rápidos de `preferredRow`: Front Row, Back Row, Middle, Custom, y notas de la atracción).
   - Conecta las páginas `src/app/parks/page.tsx`, `src/app/parks/[id]/page.tsx` y `src/app/visits/[id]/page.tsx`.
3. SUBAGENTE VERIFICADOR RDD: Invoca un subagente verificador para comprobar que ningún componente en `src/components/features/**` importa `db` directamente y que `preferredRow` y `tripNotes` están presentes en todas las vistas requeridas por `SPEC.md`.
4. VERIFICACIÓN Y GGA: Ejecuta `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build`. Audita con `gga` y haz commit `feat(ui): complete park detail, hybrid modal and optimistic mobile visit check-in`.
5. ENGRAM CHECKPOINT: Registra en Engram que todas las pantallas `[UI-01..04]` están operativas. Te adjunto el código html de stitch de ambas pantallas: "C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard (1)\code1.html" y "C:\Users\apere\Downloads\stitch_ridetracker_theme_park_dashboard (2)\code2.html"."
- L2 — Context7: React 19 `useOptimistic` uses a passthrough state plus reducer/action dispatcher; async Server Action calls must run inside a transition, and Next.js documents the same pattern for client components.
- L3 — RDD mode status: enabled globally; no candidate review consent has been started.
- L4 — User decision (2026-10-19): "commits encadenados". Use chained commits by independent behavior instead of a single oversized commit.
- L5 — T1 implementation evidence: `src/app/parks/page.tsx` now provides the server boundary; `ParksCatalog`, `ParksFilterBar`, `ParkCardGrid`, and `HybridParkSearchModal` provide typed presentational/client behavior; Queue-Times import and manual creation use existing Server Actions; `npm run typecheck`, `npm run lint`, and `npm run test` (18/18) pass.
- L6 — T2 implementation evidence: `src/app/parks/[id]/page.tsx` provides the Server Component boundary; `ParkHeroHeader`, `RideInventoryTable`, and `VisitHistoryTimeline` render status, `tripNotes`, `preferredRow`, `rating`, historical laps, visit dates, and visit notes; `npm run typecheck`, `npm run lint`, and `npm run test` (18/18) pass after replacing raw navigation with `next/link`.
- L7 — T3 implementation evidence: `src/app/visits/[id]/page.tsx` provides the Server Component boundary; `VisitDayHeader` edits day notes, `QuickRideCheckinCard` uses React 19 `useOptimistic` inside transitions for lap controls and check-ins, and `RideRatingSheet` provides rating, preferred-row chips, and notes; `npm run typecheck`, `npm run lint`, and `npm run test` (18/18) pass.

## Risk

Risk: item 3 (new App Router pages and Server Action/component boundaries are public contracts consumed by the application).
