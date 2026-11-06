# Attraction data and detail
Objective: repair imported attraction metadata, make ride activity usable, and add a Wikimedia-backed attraction detail view.
Delivery: local Docker deployment for validation; no commit or push requested. Test runner: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.

## Specs

1. **S1 — Imported metadata**: User request: "en el inventario de atracciones del parque, salen todas con el fabricante desconocido" and "La tipologia de la atracción es siempre la misma no distigue entre roller coaster, flat o dark ride". Acceptance: re-import/synchronization preserves manufacturer and distinguishes supported Queue-Times categories without overwriting user ratings, preferred rows, review notes, or ride logs.
2. **S2 — Activity tracking**: User request: "no puedo marcar el numero de veces que me he subido ni la puntuación que le doy a la atracción". Acceptance: an attraction detail flow provides access to starting a visit, logging rides/laps, and saving ratings; existing review notes are preserved; totals and rating refresh correctly.
3. **S3 — Attraction detail**: User request: "no está implementado el detalle de la atracción, quiero que en el detalle se visualice una foto de la misma, el nombre, el fabricante y el storytelling de la atracción". Acceptance: `/parks/[parkId]/rides/[rideId]` displays name, optional Wikimedia photo, manufacturer, category, totals, rating controls, and Wikimedia storytelling with a safe fallback.
4. **S4 — Data safety**: Existing SQLite data must remain readable and existing user-owned fields must not be destroyed. Wikimedia failure or missing matches must degrade to a useful local detail page.

## Tasks

- T1 (S1, S4): Correct category normalization and metadata-preserving imported-ride upsert. Route: inline. Status: complete. Evidence: Queue-Times mapper and repository conflict update.
- T2 (S2): Wire ride detail rating, visit start, lap logging, revalidation, and preserved review notes. Route: inline. Status: complete. Evidence: actions, views, and visit/rating components.
- T3 (S3, S4): Add ride detail route and Wikimedia enrichment with optional photo/story fallback. Route: inline. Status: complete. Evidence: route, detail card, and enrichment service.
- T4 (S1-S4): Add focused tests, build, deploy, and validate Docker. Route: inline. Status: complete. Evidence: TypeScript, ESLint, 25 Vitest tests, Docker build, authenticated park page, and authenticated attraction detail route all pass.

## Log

L1: "[Image 1] en el inventario de atracciones del parque, salen todas con el fabricante desconocido, no puedo marcar el numero de veces que me he subido ni la puntuación que le doy a la atracción, La tipologia de la atracción es siempre la misma no distigue entre roller coaster, flat o dark ride y no está implementado el detalle de la atracción, quiero que en el detalle se visualice una foto de la misma, el nombre, el fabricante y el storytelling de la atracción"
L2: User approved the proposed Wikimedia/Wikipedia automatic source with safe fallback: "adelante".
L3: Implemented metadata-preserving Queue-Times synchronization, Wikimedia photo/story/manufacturer enrichment, attraction detail routing, preserved review notes, visit start/lap logging access, and rating revalidation.
L4: Docker redeployed successfully on port 3000. Existing imported parks expose a `Sync attraction data` action to repair stored metadata; the detail page also uses live Wikimedia fallback when stored manufacturer data is empty.
