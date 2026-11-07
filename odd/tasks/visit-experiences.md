# Visit and experience tracking
Objective: make park visits editable and distinguish the visit-day record from individual attraction experiences.
Branch: iteration-3-dashboard. Delivery: inline slices. Test runner: Vitest, typecheck, lint, Next build.

## Specs
1. **S1 — Edit a visit**: User requirement: "Permitir editar la fecha y notas después de crear la experiencia." Acceptance: an authenticated user can update a visit date (never future) and notes after creation.
2. **S2 — Visit-day metadata**: User requirement: "Añadir duración, clima, compañía y valoración global del día." Acceptance: a visit stores and edits duration, weather, company, and a bounded 1–5 overall rating.
3. **S3 — Historical additions**: User requirement: "Poder añadir más atracciones posteriormente a una experiencia histórica." Acceptance: a visit opened from one attraction can add other park attractions to its working experience list and record them without creating another visit day.
4. **S4 — Domain language**: User requirement: "Distinguir claramente entre “visita al parque” y “experiencia concreta en una atracción”." Acceptance: UI labels the visit as a park visit and attraction check-ins as concrete ride experiences; existing ride logs remain attached to the visit day.

## Tasks
- T1 (S1-S2): Extend visit storage, validation, repository actions, and editable metadata UI. Route: inline. Status: completed. Commit: pending.
- T2 (S3-S4): Add historical attraction selection and clarify visit/experience language. Route: inline. Status: completed. Commit: pending.
- T3 (S1-S4): Verify migration compatibility, tests, typecheck, lint, and build. Route: inline. Status: completed. Commit: pending.

## Log
L1: "estos son los puntos: ... 2. Visitas y experiencias ..."
L2: Added nullable visit-day metadata columns with non-destructive startup migration, editable visit form, historical attraction picker, and explicit park-visit versus attraction-experience labels.
L3: Verification passed: typecheck, lint, 39 Vitest tests, Next build, Docker build, existing SQLite migration, and healthy web/worker services.
L4: Fixed the migration helper to use the selected table name; the first Docker verification exposed a hardcoded `rides` target before the correction.
L5: The accidental null-only columns created in `rides` during that failed verification were removed from the local SQLite file; the intended `visit_days` columns remain present.
