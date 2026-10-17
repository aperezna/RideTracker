# RideTracker Iteration 2 Backend
Branch: `iteration-2-backend`
Delivery: one atomic backend work unit
Test runner: `npm run typecheck`, `npm run lint`, `npm run test`

## Specs

1. **S1 — Context7 and implementation constraints**
   - "CONSULTA CONTEXT7: Usa Context7 para consultar la sintaxis vigente de Next.js 15 Server Actions, Middleware y `zod`."
   - "IMPLEMENTACIÓN:"
   - Scope: follow `[RF-01..05]`, `[RNF-04]`, and `[RNF-05]` from `SPEC.md`; use strict TypeScript and existing TECH-03 schema.
   - Checks: Context7 evidence, typecheck, lint, tests, GGA.

2. **S2 — Zod validators**
   - "Crea en `src/core/validators/` los esquemas Zod para Parques (con `tripNotes`), Atracciones (con `preferredRow` y `rating`), Jornadas de Visita (`visitDate`, `tripNotes`) y Check-ins (`lapCount`, `rowUsed`)."
   - Checks: schemas reject invalid enums, dates, ratings, and lap counts; valid payloads infer strict types.

3. **S3 — Queue-Times import service**
   - "Implementa `src/core/services/queue-times.service.ts` para buscar e importar parques y sus atracciones server-side con timeout de 5s (`[RF-01]`, `[RNF-04]`)."
   - Checks: external requests use a five-second timeout, map the external result into local shapes, and fail safely on non-OK responses.

4. **S4 — Server Actions**
   - "Implementa las Server Actions en `src/actions/` para: importar/crear parque, actualizar `tripNotes`, registrar Jornada de Visita (disparando transición a `VISITED` según `[RF-02]`), registrar check-in de atracción (`[RF-04]`) y actualizar valoración/`preferredRow` (`[RF-05]`)."
   - Checks: actions validate inputs at the boundary, preserve imported rides, update the existing schema through `db`, and revalidate affected routes.

5. **S5 — Single-user auth and backup**
   - "Añade autenticación ligera en `src/middleware.ts` mediante `APP_MASTER_PASSWORD` y cookie `HttpOnly` (`[RNF-05]`) y un endpoint `/api/backup` para exportar/importar JSON (`[RNF-03]`)."
   - Checks: protected routes require the signed HttpOnly session cookie; backup exports and imports the complete SQLite dataset through the public route.

6. **S6 — RDD verification and delivery**
   - "SUBAGENTE VERIFICADOR RDD: Lanza un subagente verificador en modo lectura que audite el código creado citando literalmente `[RF-01]`, `[RF-02]`, `[RF-04]` y `[RNF-05]` de `SPEC.md`, más un test de integración con SQLite en memoria en Vitest."
   - "VERIFICACIÓN Y GGA: Ejecuta `npm run typecheck`, `npm run lint` y `npm run test`. Pasa `gga` y crea el commit `feat(backend): hybrid park importer, server actions and single-user auth`."
   - "ENGRAM CHECKPOINT: Guarda en Engram el cierre de la Iteración 2 y las firmas de las Server Actions creadas."
   - Checks: verifier verdict, required commands, GGA, commit, Engram checkpoint.

## Tasks

- T1 — S1-S2 — inline — pending — no commit
- T2 — S3-S5 — inline — pending — no commit
- T3 — S6 — delegated verifier + inline delivery — pending — no commit

## Log

- L1 — User request (2026-10-17):
  "Recupera de Engram el estado del proyecto y lee SPEC.md ([RF-01..05], [RNF-04], [RNF-05]). Vamos a por la Iteración 2:
1. CONSULTA CONTEXT7: Usa Context7 para consultar la sintaxis vigente de Next.js 15 Server Actions, Middleware y `zod`.
2. IMPLEMENTACIÓN:
   - Crea en `src/core/validators/` los esquemas Zod para Parques (con `tripNotes`), Atracciones (con `preferredRow` y `rating`), Jornadas de Visita (`visitDate`, `tripNotes`) y Check-ins (`lapCount`, `rowUsed`).
   - Implementa `src/core/services/queue-times.service.ts` para buscar e importar parques y sus atracciones server-side con timeout de 5s (`[RF-01]`, `[RNF-04]`).
   - Implementa las Server Actions en `src/actions/` para: importar/crear parque, actualizar `tripNotes`, registrar Jornada de Visita (disparando transición a `VISITED` según `[RF-02]`), registrar check-in de atracción (`[RF-04]`) y actualizar valoración/`preferredRow` (`[RF-05]`).
   - Añade autenticación ligera en `src/middleware.ts` mediante `APP_MASTER_PASSWORD` y cookie `HttpOnly` (`[RNF-05]`) y un endpoint `/api/backup` para exportar/importar JSON (`[RNF-03]`).
3. SUBAGENTE VERIFICADOR RDD: Lanza un subagente verificador en modo lectura que audite el código creado citando literalmente `[RF-01]`, `[RF-02]`, `[RF-04]` y `[RNF-05]` de `SPEC.md`, más un test de integración con SQLite en memoria en Vitest.
4. VERIFICACIÓN Y GGA: Ejecuta `npm run typecheck`, `npm run lint` y `npm run test`. Pasa `gga` y crea el commit `feat(backend): hybrid park importer, server actions and single-user auth`.
5. ENGRAM CHECKPOINT: Guarda en Engram el cierre de la Iteración 2 y las firmas de las Server Actions creadas."
- L2 — Context7 verified Next.js 15 async `cookies()`, Server Actions with `'use server'`, `revalidatePath`, middleware matchers, and Zod `z.object`/`z.enum`/`safeParse` patterns.
