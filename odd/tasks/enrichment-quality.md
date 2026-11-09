# Enrichment quality and provenance
Objective: make enrichment trustworthy, explainable, manually correctable, and less wasteful under provider failures.
Branch: iteration-3-dashboard. Delivery: inline slices. Test runner: Vitest, typecheck, lint, Next build, Docker Compose.

## Specs
1. **S1 — Source badges**: User requirement: "Mostrar una insignia por fuente: Queue-Times, ThemeParks.wiki, Wikimedia, RCDB, etc." Acceptance: persisted field provenance is visible on attraction details and never presents a live fallback as a confirmed stored value.
2. **S2 — Manual corrections**: User requirement: "Permitir corregir manualmente categoría, fabricante o descripción." Acceptance: authenticated manual edits are persisted and enrichment does not overwrite manually controlled fields.
3. **S3 — Failure cooldown**: User requirement: "No volver a consultar una fuente si ya falló varias veces recientemente." Acceptance: repeated enrichment failures create a cooldown record and the worker skips the bounded source scope until retry time.
4. **S4 — Aliases**: User requirement: "Añadir aliases por atracción para nombres como Max & Moritz Single-rider." Acceptance: aliases are persisted and used by normalized matching without changing the canonical attraction name.
5. **S5 — Official links**: User requirement: "Incorporar fuentes oficiales solo mediante URLs verificadas por parque." Acceptance: only HTTPS official links explicitly verified for a park are shown as official sources.

## Tasks
- T1 (S1-S2): Add field provenance, manual overrides, and editable attraction correction UI. Route: inline. Status: complete; typecheck/lint/tests green. Commit: working tree.
- T2 (S3-S4): Add failure cooldowns and attraction aliases to enrichment/matching. Route: inline. Status: pending. Commit: pending.
- T3 (S5): Add verified official park links and presentation. Route: inline. Status: pending. Commit: pending.
- T4 (S1-S5): Verify migrations, tests, build, Docker, and source/manual invariants. Route: inline. Status: pending. Commit: pending.

## Log
L1: "vamos con el punto 5?"
L2: Added field-level source records, protected manual correction flags, authenticated correction actions, source cooldown records, alias/verified-link persistence primitives, and attraction-detail source badges. Remaining: expose verified park links and add focused regression tests for the new repositories and worker cooldown behavior.
