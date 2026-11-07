# Attraction data and detail
Objective: repair imported attraction metadata, make ride activity usable, and add a Wikimedia-backed attraction detail view.
Delivery: local Docker deployment for validation; no commit or push requested. Test runner: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Specs

1. **S1 — Imported metadata**: User request: "en el inventario de atracciones del parque, salen todas con el fabricante desconocido" and "La tipologia de la atracción es siempre la misma no distigue entre roller coaster, flat o dark ride". Acceptance: re-import/synchronization preserves manufacturer and distinguishes supported Queue-Times categories without overwriting user ratings, preferred rows, review notes, or ride logs.
2. **S2 — Activity tracking**: User request: "no puedo marcar el numero de veces que me he subido ni la puntuación que le doy a la atracción". Acceptance: an attraction detail flow provides access to starting a visit, logging rides/laps, and saving ratings; existing review notes are preserved; totals and rating refresh correctly.
3. **S3 — Attraction detail**: User request: "no está implementado el detalle de la atracción, quiero que en el detalle se visualice una foto de la misma, el nombre, el fabricante y el storytelling de la atracción". Acceptance: `/parks/[parkId]/rides/[rideId]` displays name, optional Wikimedia photo, manufacturer, category, totals, rating controls, and Wikimedia storytelling with a safe fallback.
4. **S4 — Data safety**: Existing SQLite data must remain readable and existing user-owned fields must not be destroyed. Wikimedia failure or missing matches must degrade to a useful local detail page.
5. **S5 — Progressive category enrichment**: User request: "Te sigue pasando lo mismo [Image 1]  la primera atracción con categoria correcta pero las demás ya no lo son... Puede ser que wikipedia bloquee las peticiones del resto? Si es así, configura una tarea para que una vez importado el parque, poco a poco vayas recogiendo los datos de wikipedia y refrescando en el detalle una por una". Acceptance: imported rides are queued for serialized Wikimedia enrichment, retries and resumes safely after transient failures or process restarts, and each resolved category appears in the park detail without blocking park import.
6. **S6 — Queue freshness**: User request: "ten en cuenta que los minutos de cola de las atracciones de todos los parques se deben actualizar cada 10 minutos". Acceptance: Queue-Times requests use a 600-second revalidation window per park so the next detail request after expiry refreshes live queue data without excessive external requests.
7. **S7 — Attraction photos**: User request: "no se cargan las fotos de las atracciones". Acceptance: ride detail pages resolve Wikimedia images through direct article HTML metadata when API/search endpoints are unavailable, and Next.js permits the Wikimedia image host.
8. **S8 — Persisted attraction photos**: User request: "Podemos almacenar en base de datos las imagenes de cada atracción y con la tarea de refresco de datos ir consultando todo?". Acceptance: photo URLs and their source are persisted per ride, the progressive enrichment worker stores them one by one, and the detail page prefers stored photos over transient Wikimedia responses.

## Tasks

- T1 (S1, S4): Correct category normalization and metadata-preserving imported-ride upsert. Route: inline. Status: complete. Evidence: Queue-Times mapper and repository conflict update.
- T2 (S2): Wire ride detail rating, visit start, lap logging, revalidation, and preserved review notes. Route: inline. Status: complete. Evidence: actions, views, and visit/rating components.
- T3 (S3, S4): Add ride detail route and Wikimedia enrichment with optional photo/story fallback. Route: inline. Status: complete. Evidence: route, detail card, and enrichment service.
- T4 (S1-S4): Add focused tests, build, deploy, and validate Docker. Route: inline. Status: complete. Evidence: TypeScript, ESLint, 25 Vitest tests, Docker build, authenticated park page, and authenticated attraction detail route all pass.
- T5 (S5): Add durable serialized Wikimedia enrichment queue, progressive detail refresh, and retry/status visibility. Route: inline. Status: complete. Evidence: SQLite queue, serialized worker, stale-job recovery, UNKNOWN preservation, tests, and independent recheck approved.
- T6 (S6): Add ten-minute Queue-Times revalidation for live wait times. Route: inline. Status: complete. Evidence: 600-second fetch revalidation, tests, typecheck, lint, build, and Docker redeploy.
- T7 (S7): Add Wikimedia HTML image fallback and remote image configuration. Route: inline. Status: complete. Evidence: metadata test, 32 Vitest tests, typecheck, lint, build, and Docker redeploy.
- T8 (S8): Persist ride photo metadata and process it through the progressive enrichment queue. Route: inline. Status: complete. Evidence: legacy migration, stored-photo fallback, worker persistence, independent verification, 32 Vitest tests, build, and Docker redeploy.

## Log

L1: "[Image 1] en el inventario de atracciones del parque, salen todas con el fabricante desconocido, no puedo marcar el numero de veces que me he subido ni la puntuación que le doy a la atracción, La tipologia de la atracción es siempre la misma no distigue entre roller coaster, flat o dark ride y no está implementado el detalle de la atracción, quiero que en el detalle se visualice una foto de la misma, el nombre, el fabricante y el storytelling de la atracción"
L2: User approved the proposed Wikimedia/Wikipedia automatic source with safe fallback: "adelante".
L3: Implemented metadata-preserving Queue-Times synchronization, Wikimedia photo/story/manufacturer enrichment, attraction detail routing, preserved review notes, visit start/lap logging access, and rating revalidation.
L4: Docker redeployed successfully on port 3000. Existing imported parks expose a `Sync attraction data` action to repair stored metadata; the detail page also uses live Wikimedia fallback when stored manufacturer data is empty.
L5: "Te sigue pasando lo mismo [Image 1]  la primera atracción con categoria correcta pero las demás ya no lo son... Puede ser que wikipedia bloquee las peticiones del resto? Si es así, configura una tarea para que una vez importado el parque, poco a poco vayas recogiendo los datos de wikipedia y refrescando en el detalle una por una"
L6: Implemented durable per-park category jobs with one-at-a-time Wikimedia processing, five-second pacing, retry/backoff, stale PROCESSING recovery, explicit UNKNOWN for unresolved new rides, and preservation of existing resolved categories. Independent verifier approved the final recheck after correcting UNKNOWN conflict updates.
L7: "ten en cuenta que los minutos de cola de las atracciones de todos los parques se deben actualizar cada 10 minutos"
L8: "no se cargan las fotos de las atracciones"
L9: "Podemos almacenar en base de datos las imagenes de cada atracción y con la tarea de refresco de datos ir consultando todo?"
