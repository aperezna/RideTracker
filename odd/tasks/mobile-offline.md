# Mobile and offline mode
Objective: make the most common in-park action fast and resilient when connectivity is unreliable.
Branch: iteration-3-dashboard. Delivery: inline slices. Test runner: Vitest, typecheck, lint, Next build, Docker Compose.

## Specs
1. **S1 — Installable PWA**: User requirement: "PWA instalable." Acceptance: the application exposes a manifest, icons, standalone display metadata, and registers a service worker for the application shell.
2. **S2 — Offline ride queue**: User requirement: "Cola offline para registrar atracciones." Acceptance: a ride check-in made without network is stored locally with an idempotent request ID and visible pending state; it does not wait for external enrichment sources.
3. **S3 — Synchronization**: User requirement: "Sincronización posterior." Acceptance: queued check-ins retry when connectivity returns, remove only after a successful server response, and remain safe across duplicate delivery attempts.
4. **S4 — Mobile interaction**: User requirement: "Botones grandes y navegación rápida." Acceptance: check-in controls remain touch-friendly and the UI exposes online/offline and pending-queue status without blocking the action.
5. **S5 — Offline boundary**: User requirement: "Evitar esperar a fuentes externas para registrar una experiencia." Acceptance: offline mode covers ride-log writes only; enrichment remains an independent asynchronous concern and never runs on the check-in path.

## Tasks
- T1 (S1): Add service worker registration, manifest metadata, and shell caching. Route: inline. Status: completed. Commit: pending.
- T2 (S2-S3): Add authenticated idempotent ride-log API and IndexedDB queue/sync client. Route: inline. Status: completed. Commit: pending.
- T3 (S4-S5): Wire mobile status and offline check-in UX. Route: inline. Status: completed. Commit: pending.
- T4 (S1-S5): Verify offline boundary, tests, typecheck, lint, build, and Docker. Route: inline. Status: completed. Commit: pending.

## Log
L1: "pues venga vayamos al punto 3"
L2: Added PWA service-worker registration, shell caching, authenticated `/api/ride-logs`, idempotent IndexedDB check-in queue, reconnect synchronization, and visible offline/pending status.
L3: Verification passed: typecheck, lint, 39 Vitest tests, Next build, Docker build, both services healthy, authenticated manifest/service-worker responses, and unauthenticated API rejection.
