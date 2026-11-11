# External data imports
Objective: establish a safe generic import foundation for user-owned RideTracker data and public-source enrichment.
Branch: iteration-3-dashboard
Delivery: reviewable work-unit commits, with tests and documentation alongside each behavior.
Test runner: `npm run test`; required checks also include `npm run typecheck`, `npm run lint`, and `npm run build`.

## Specs

### S1 — External application data
User requirement: “debemos empezar a pensar como cargar datos de apps externas a nuestra aplicación”.
Authorized scope: create the foundation needed to ingest external records without bypassing authentication or user ownership.
Acceptance: imported records are attributable to the authenticated user, validated before persistence, and do not expose another user's data.
Checks: unit tests for parsing/validation and integration tests for ownership and persistence.

### S2 — Market sources and closed systems
Decision from exploration: LogRide does not provide a supported user-data export, so it is not an import source.
Authorized scope: keep the importer source-agnostic, support user-controlled CSV/JSON data, and leave public APIs as separate enrichment connectors.
Acceptance: unsupported or ambiguous external formats are reported without silently creating incorrect records; no credential scraping or direct account access is used.
Checks: fixture-based parser tests for canonical CSV/JSON inputs and source-specific tests only when an official API contract exists.

### S3 — Implement the approved first phase
User authorization: “adelante”.
Authorized phase: foundation + generic CSV/JSON import + public-source enrichment boundary, as revised after market exploration.
Acceptance: a reviewable import flow supports preview, validation, duplicate detection, and an explicit apply step; the existing catalog and visit flows remain functional.
Checks: focused tests, full test suite, typecheck, lint, build, and documentation readback.

## Tasks

- T1 (S1-S3): Define source-agnostic import contracts, normalized identity matching, and a validated preview/apply service. Route: inline. Status: complete; focused importer tests, typecheck, and lint green. Commit: 5e8143e.
- T2 (S1-S3): Add the authenticated import UI/API and persistence transaction with duplicate reporting. Route: inline. Status: complete; `/import`, `/api/import`, preview/apply flow, ownership, and duplicate handling implemented. Commit: 5e8143e.
- T3 (S2-S3): Add source metadata and public-enrichment connector boundaries without importing closed-account data. Route: inline. Status: complete; added a registry for Queue-Times and ThemeParks.wiki, wired attribution through the registry, and documented the boundary between enrichment and personal imports. Commit: c33c6cd.
- T4 (S1-S3): Add user documentation and complete verification. Route: inline. Status: complete; README updated; 47 tests, typecheck, lint, build, and diff check green. Commit: 5e8143e.
- T5 (S2-S3): Show public enrichment state and provider attribution on park detail pages. Route: inline. Status: complete; added available/closed/unavailable states, source, signal count, and public-only boundary copy in English and Spanish. Commit: pending.

## Log

L1: “las funcionalidades me encantan, podemos implementar todas?”
L2: “adelante”
L3: The first delivery is limited to the revised foundation + generic import + public-enrichment boundary; later features remain separate phases.
L4: Existing data model has user-owned parks, rides, visit days, ride logs, wait observations, aliases, and field-source records. Queue-Times park import is an existing source-specific flow and must remain working.
L5: “ok perfecto”
L6: “eso es”
L7: Market exploration found no supported LogRide user-data export. Coaster-Count has no documented public export in the reviewed app page; CreditTracker exposes a small open API; Queue-Times and ThemeParks.wiki are public enrichment sources rather than personal-history imports.
L8: “procede”
L9: Implemented the first usable Import Center slice with canonical CSV/JSON rows, preview/apply, validation, ownership isolation, deterministic IDs, and duplicate detection. External adapters remain deferred until official public contracts are selected.
L10: Verification completed: `npm run test` (47 passing), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed.
L11: Added `public-enrichment.ts` as the explicit registry for public provider metadata and capabilities; existing adapters remain fail-soft enrichment only.
L12: Added the park detail enrichment panel with provider attribution, live availability state, signal count, and explicit public-only messaging.
