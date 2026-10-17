# Project Specification: RideTracker (Theme Park & Ride Tracker)

## 1. Contexto y Alcance del MVP
Aplicación web individual (Mobile-First PWA + Desktop Command Center) para gestionar el inventario de parques temáticos (Wishlist, Planificados y Visitados), registrar Jornadas de Visita por fecha, contabilizar check-ins de atracciones (Coaster Count único vs Re-rides), documentar la fila preferida y notas de viaje, y visualizar analíticas (Top 10 atracciones y Mapa por país).

* **In Scope:** Catálogo híbrido (Queue-Times API + CRUD manual), estados de parque y notas de viaje, sesiones de visita por día, check-in rápido con conteo de repeticiones, fila preferida (`preferredRow`), puntuación (1-10), Dashboard con KPIs, Top 10 y Mapa interactivo.
* **Out of Scope:** Multiusuario/Red social, alertas push de tiempos de espera en vivo, almacenamiento de vídeo pesado.

## 2. Requisitos Funcionales (`[RF-XX]`)

* **[RF-01] Catálogo Híbrido de Parques y Atracciones:** Búsqueda e importación server-side desde Queue-Times API + alta/edición manual. Categorías: `COASTER`, `DARK_RIDE`, `WATER`, `FLAT_RIDE`, `SHOW`. 
  * *Criterio:* Given un parque importado o manual When se añade una atracción manual Then persiste vinculada sin sobrescribir las existentes.
* **[RF-02] Estados de Parque y Notas de Viaje:** Estados `WISHLIST`, `PLANNED`, `VISITED` y campo `tripNotes` para logística/planificación. 
  * *Criterio:* Given un parque en `WISHLIST` o `PLANNED` When se registra su primera Jornada de Visita (`[RF-03]`) Then su estado cambia automáticamente a `VISITED`.
* **[RF-03] Jornadas de Visita (`visit_days`):** Registro de visita por parque y fecha (`YYYY-MM-DD`) con campo `tripNotes` específico de la jornada (clima, afluencia, resumen del día). 
  * *Criterio:* Given un parque válido When se crea una visita con fecha y `tripNotes` Then se habilita el registro de check-ins para esa jornada.
* **[RF-04] Check-in de Atracciones por Día (`ride_logs`):** Registro por jornada indicando estado (`RIDDEN`, `CLOSED`), número de repeticiones en el día (`lapCount >= 1`), fila montada en el día y notas rápidas. 
  * *Criterio:* Given una atracción categoría `COASTER` sin registros previos `RIDDEN` When se guarda un `ride_log` con `lapCount >= 1` Then el `Coaster Count Único` incrementa en `+1` y el `Total Laps` suma `lapCount`.
* **[RF-05] Valoración Personal, Fila Preferida y Top 10:** Cada atracción soporta `rating` (1.0 a 10.0), `preferredRow` (`FRONT`, `BACK`, `MIDDLE`, `ANY` o texto específico como "Fila 1 Derecha (Wing)") y `reviewNotes`. 
  * *Criterio:* Given atracciones montadas con `rating` asignado When se consulta el Top 10 Then se ordenan por `rating DESC`, desempatando por suma histórica de `lapCount DESC`.
* **[RF-06] Dashboard Analítico y Mapa por País:** Vista principal con KPIs (Parques Visitados vs Wishlist/Planned, Coaster Count único vs Total Laps), Top 10 Atracciones (mostrando `rating` y `preferredRow`) y Mapa interactivo con marcadores diferenciados por estado y agrupados por país. 
  * *Criterio:* Given la carga de `/` When existen datos en SQLite Then renderiza KPIs exactos, Top 10 y mapa interactivo en < 200ms.

## 3. Requisitos No Funcionales (`[RNF-XX]`)

* **[RNF-01] Mobile-First & PWA:** Check-in en vista de visita activa realizable en < 3 toques con `useOptimistic` (feedback visual en 0ms).
* **[RNF-02] Docker Multi-Arch Ligero:** `Dockerfile` standalone (`node:22-alpine`) compatible con `linux/amd64` y `linux/arm64`, consumo < 250MB RAM.
* **[RNF-03] Persistencia SQLite ACID & Backup:** Base de datos `better-sqlite3` en modo WAL (`pragma journal_mode = WAL`) alojada en `/app/data/coastervault.db` + endpoint de Export/Import JSON completo.
* **[RNF-04] Latencia y Caché Server-Side:** Dashboard SSR/ISR < 200ms; llamadas al catálogo externo exclusivamente vía Route Handlers/Server Actions con timeout de 5s.
* **[RNF-05] Seguridad Single-User:** Middleware de protección con contraseña maestra (`APP_MASTER_PASSWORD`) y sesión en cookie `HttpOnly`, `SameSite=Lax`.
* **[RNF-06] Calidad y Tipado Estricto:** TypeScript `strict: true`, validación en frontera con Zod y cobertura de tests unitarios en Vitest para cálculos de dominio (`Coaster Count`, transición de estado y `Top 10`).

## 4. Especificación UI y Handoff de Google Stitch (`[UI-XX]`)

* **[UI-01] Command Center Dashboard:** Componentes puros `<KpiStatsRow/>`, `<ParksWorldMap/>` (cargado con `next/dynamic` `ssr: false`) y `<TopRidesLeaderboard/>` (incluye badge de `preferredRow`).
* **[UI-02] Catálogo & Buscador Híbrido:** `<ParksFilterBar/>`, `<ParkCardGrid/>` (mostrando extracto de `tripNotes`) y `<HybridParkSearchModal/>`.
* **[UI-03] Detalle de Parque & Inventario:** `<ParkHeroHeader/>` (con editor inline de `tripNotes` del parque), `<RideInventoryTable/>` (muestra `preferredRow`, `rating` y total de viajes) y `<VisitHistoryTimeline/>` (muestra `tripNotes` de cada día).
* **[UI-04] Modo "Día en el Parque" (Mobile Visit Check-in):** `<VisitDayHeader/>` (con `tripNotes` de la jornada), `<QuickRideCheckinCard/>` (stepper `[- lapCount +]` optimista) y `<RideRatingSheet/>` (selector de `rating` 1-10, chips de `preferredRow`: Front/Back/Middle/Custom y notas).

* **Regla de Desacoplamiento Stitch:** Ningún componente en `src/components/features/**` puede importar `db` ni ejecutar `fetch`. Todo dato entra por `props` tipadas y toda mutación sale por callbacks conectados a Server Actions.

## 5. Decisiones Técnicas y Arquitectura (`[TECH-XX]`)

* **[TECH-01] Stack Oficial:** Next.js 15 (App Router), React 19, TypeScript 5.x, Drizzle ORM + `better-sqlite3`, Zod, Tailwind CSS + `shadcn/ui` + `lucide-react`, `react-leaflet` + `leaflet`, Vitest.
* **[TECH-02] Estructura de Carpetas y Capas:**
  ```text
  src/
  ├── app/                  # Rutas App Router (Server Components) y API (export/import)
  ├── components/
  │   ├── ui/               # Átomos shadcn/ui
  │   └── features/         # Componentes Presentacionales puros (Stitch Handoff)
  ├── core/
  │   ├── db/               # schema.ts, index.ts (WAL config) y migraciones Drizzle
  │   ├── domain/           # Lógica pura testeable (coaster-stats.ts, rankings.ts)
  │   ├── services/         # queue-times.service.ts, park.service.ts, visit.service.ts
  │   └── validators/       # Esquemas Zod (park.schema.ts, visit.schema.ts)
  └── actions/              # Server Actions (mutaciones + revalidatePath)
  ```
* **[TECH-03] Modelo de Datos en Drizzle (`src/core/db/schema.ts`):**
  * `parks` : `id` (`text PK`), `externalId` (`text nullable`), `name` (`text`), `country` (`text`), `city` (`text`), `latitude` (`real`), `longitude` (`real`), `status` (`WISHLIST` | `PLANNED` | `VISITED`), `tripNotes` (`text`), `createdAt` (`integer`).
  * `rides` : `id` (`text PK`), `parkId` (`text FK -> parks.id`), `externalId` (`text nullable`), `name` (`text`), `category` (`COASTER` | `DARK_RIDE` | `WATER` | `FLAT_RIDE` | `SHOW`), `manufacturer` (`text`), `rating` (`real nullable`), `preferredRow` (`text nullable`), `reviewNotes` (`text nullable`).
  * `visitDays` : `id` (`text PK`), `parkId` (`text FK -> parks.id`), `visitDate` (`text YYYY-MM-DD`), `tripNotes` (`text nullable`), `createdAt` (`integer`).
  * `rideLogs` : `id` (`text PK`), `visitDayId` (`text FK -> visitDays.id`), `rideId` (`text FK -> rides.id`), `status` (`RIDDEN` | `CLOSED`), `lapCount` (`integer default 1`), `rowUsed` (`text nullable`), `notes` (`text nullable`).

## 6. Comandos Deterministas de Verificación

* Typecheck: `npm run typecheck` (`tsc --noEmit`)
* Lint: `npm run lint` (`next lint`)
* Tests Unitarios e Integración: `npm run test` (`vitest run`)
* Build de Producción: `npm run build`