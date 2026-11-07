# Data and analytics
Objective: turn live wait observations and persisted visit experiences into useful personal history and portable exports.
Branch: iteration-3-dashboard. Delivery: inline slices. Test runner: Vitest, typecheck, lint, Next build, Docker Compose.

## Specs
1. **S1 — Wait history**: User requirement: "Historial de tiempos de espera." Acceptance: live wait values are persisted with attraction, source, timestamp, open state, and observed minutes; repeated page refreshes are throttled.
2. **S2 — Expected wait**: User requirement: "Tiempo ahorrado o esperado por atracción." Acceptance: analytics exposes observed average/minimum wait and an estimated wait exposure for recorded attraction experiences; it does not claim saved time without actual queue-duration data.
3. **S3 — Personal analytics**: User requirements: "Ranking personal por parque", "Número de vueltas, mejores filas y mejores días", and "Comparación entre visitas." Acceptance: dashboard reports park/ride rankings, laps, shortest observed lines, best visit days, and comparable visit summaries.
4. **S4 — Exports**: User requirement: "Exportación CSV/JSON además del backup actual." Acceptance: authenticated downloads provide analytics and persisted data in JSON and a tabular CSV without exposing unauthenticated data.
5. **S5 — Compatibility**: Acceptance: existing backups remain importable; new wait-history and visit metadata fields are migrated non-destructively.

## Tasks
- T1 (S1-S2): Persist throttled wait observations and calculate expected-wait metrics. Route: inline. Status: completed. Commit: pending.
- T2 (S3): Add personal rankings, best lines, and visit comparisons to the dashboard. Route: inline. Status: completed. Commit: pending.
- T3 (S4-S5): Add authenticated CSV/JSON exports and extend backup compatibility. Route: inline. Status: completed. Commit: pending.
- T4 (S1-S5): Verify analytics, migration, exports, tests, typecheck, lint, build, and Docker. Route: inline. Status: completed. Commit: pending.

## Log
L1: "continuamos con el 4"
L2: Added throttled wait-time observations, personal rankings, best observed lines/days, estimated wait exposure, authenticated JSON/CSV exports, and backup compatibility for wait history and visit metadata.
L3: Actual saved time is intentionally not claimed because ride logs do not yet record measured queue duration; analytics labels the value as observed/estimated wait.
L4: Verification passed: typecheck, lint, 40 Vitest tests, Next build, Docker build, SQLite migration, healthy services, authenticated exports, and unauthenticated export rejection.
