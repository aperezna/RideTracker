# RideTracker

RideTracker is a self-hosted personal theme-park and attraction tracker. It combines a SQLite-backed catalog, park planning, editable visit history, attraction experiences, ratings, an interactive world map, live queue data, progressive enrichment, and a production-ready Docker image.

The current release supports multiple user accounts: each user signs in with an email and password, and SQLite stores the data locally in `./data`.

## Quick start with Docker

### Requirements

- Docker Desktop with Docker Compose v2.
- A host port `3000` available.

### Start RideTracker

From the repository root:

```powershell
$env:APP_SESSION_SECRET = "generate-a-long-random-secret"
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The first request redirects to `/login`.

Check the container:

```powershell
docker compose ps
docker compose logs -f ridetracker
docker compose logs -f enrichment-worker
```

The Compose stack runs two services:

- `ridetracker` — Next.js web application on port `3000`.
- `enrichment-worker` — independent SQLite-backed worker for attraction metadata, photos, descriptions, and storytelling.

Both services run inside the container as the non-root user `nextjs` (UID 1001). SQLite data is persisted in the repository's `data/` directory.

### Stop the application

```powershell
docker compose down
```

Stopping the stack does not delete `./data`.

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `APP_SESSION_SECRET` | Yes | — | Long random secret used to sign HTTP-only user session cookies. It is not a login password. |
| `DATABASE_URL` | No | `/app/data/coastervault.db` in Docker | SQLite database path inside the container. |
| `QUEUE_TIMES_BASE_URL` | No | `https://queue-times.com` | Override the Queue-Times API base URL for testing or a compatible service. |
| `NODE_ENV` | No | `production` in Docker | Next.js runtime mode. |
| `ENRICHMENT_HEARTBEAT_PATH` | No | `/app/data/enrichment-worker.heartbeat` | Worker heartbeat file used by the Docker healthcheck. |

Do not commit real secrets, `.env` files, SQLite data, or generated `.atl/` files. Set `APP_SESSION_SECRET` in the shell that invokes Compose or use a secrets manager in the deployment environment.

## Using the application

### Authentication

1. Open the application URL.
2. Enter your registered email and password on `/login`.
3. RideTracker verifies the stored password hash and creates an HTTP-only session cookie.

Unauthenticated page requests redirect to `/login`; unauthenticated API requests return `401 Unauthorized`.

## Manual de usuario

Esta sección describe el flujo normal para utilizar RideTracker desde el navegador.

### 1. Crear una cuenta e iniciar sesión

1. Abre la dirección de RideTracker y selecciona **Crear cuenta**.
2. Introduce tu email y una contraseña de al menos 10 caracteres.
3. Tras registrarte, la aplicación inicia tu sesión automáticamente.
4. En sesiones posteriores, utiliza tu email y contraseña en `/login`.
5. Para cerrar la sesión, selecciona **Cerrar sesión** en la navegación superior.

Cada cuenta tiene sus propios parques, visitas, atracciones, valoraciones y estadísticas. Los datos de otros usuarios no aparecen en tu dashboard ni en tu catálogo.

### 2. Añadir parques

1. Abre **Parks** desde la navegación principal.
2. Para importar un parque, utiliza la búsqueda del catálogo de Queue-Times y selecciona **Importar**. La importación incluye los datos disponibles y sus atracciones.
3. Para crear un parque manualmente, selecciona la opción de alta manual e introduce como mínimo nombre, país, ciudad, latitud y longitud.
4. Define el estado del parque: **Wishlist**, **Planned** o **Visited**.
5. Usa el buscador y los filtros para localizar tus parques.

Los parques manuales necesitan latitud y longitud válidas para aparecer en el mapa del dashboard.

### 3. Consultar el dashboard

El dashboard (`/`) muestra:

- Resumen de parques visitados, planificados y guardados en wishlist.
- Número de atracciones únicas, vueltas registradas y principales atracciones.
- Mapa con los parques de tu cuenta. El mapa ajusta automáticamente el encuadre a los puntos disponibles.
- Resumen por país y estadísticas de visitas, experiencias, vueltas y tiempos de espera.

Selecciona una atracción del ranking o un parque del mapa para abrir su detalle.

### 4. Consultar un parque y sus atracciones

En la página de detalle de un parque puedes:

- Consultar el inventario de atracciones.
- Ver el estado de apertura y el tiempo de espera cuando las fuentes externas proporcionan datos.
- Revisar el historial de visitas.
- Iniciar una visita con una fecha concreta.
- Abrir una atracción para guardar valoración, fila preferida y notas.

Los datos externos pueden tardar en aparecer o no estar disponibles si el proveedor está caído, limita peticiones o no reconoce el parque.

### 5. Registrar una visita y hacer check-in

1. Desde un parque, selecciona **Iniciar visita**.
2. Elige la fecha; también puedes registrar una visita histórica.
3. Completa los datos opcionales de la jornada: duración, clima, compañía, valoración general y notas.
4. En cada atracción, ajusta el número de vueltas y pulsa **Check-in**.
5. Puedes añadir más atracciones a la visita desde su página.
6. Revisa o edita los datos de la jornada desde el encabezado de la visita.

La visita de parque y cada experiencia en una atracción se almacenan por separado. Si registras la primera visita de un parque planificado, su estado pasa automáticamente a **Visited**.

### 6. Usar la aplicación sin conexión

Durante una visita, si pierdes la conexión:

1. Continúa utilizando **Check-in** en las atracciones.
2. RideTracker guarda temporalmente los check-ins en el navegador.
3. El indicador de la navegación muestra el estado offline y el número de operaciones pendientes.
4. Cuando vuelva la conexión, la cola se sincroniza automáticamente.

La captura offline está disponible para check-ins. Importar parques, actualizar el catálogo y consultar proveedores externos requiere conexión con el servidor.

### 7. Exportar tus datos

Con la sesión iniciada, puedes descargar tus datos desde:

- JSON: `/api/export?format=json`
- CSV: `/api/export?format=csv`

Las exportaciones están limitadas a los datos de la cuenta autenticada.

### 8. Idioma y privacidad

- Cambia el idioma desde el selector de la navegación superior.
- Cierra la sesión al utilizar un dispositivo compartido.
- No compartas tu contraseña ni el contenido de tu sesión.
- Si se cambia la clave técnica `APP_SESSION_SECRET` del servidor, todas las sesiones existentes caducan y será necesario iniciar sesión de nuevo.

### Main navigation

The global navigation provides:

- **Dashboard** (`/`) — season summary, KPIs, top rides, country summaries, and the world map.
- **Parks** (`/parks`) — searchable and filterable park catalog.

Additional routes are reached from catalog cards and visit history:

- `/parks/[id]` — park detail, ride inventory, notes, and visit history.
- `/visits/[id]` — editable park visit and concrete attraction experiences.

### Managing parks

From **Parks** you can:

- Search the Queue-Times catalog and import a park with its available rides.
- Add a park manually with name, country, city, latitude, longitude, and notes.
- Filter parks by `Wishlist`, `Planned`, or `Visited`.
- Open a park detail page to inspect rides and visits.

Queue-Times responses are validated and normalized. The integration accepts the current array-of-continents response format and numeric coordinates represented as strings.

### Visits and rides

Park detail pages provide the ride inventory and visit history. Visit workflows support:

- Creating a park visit with a historical date.
- Editing the visit date, notes, duration, weather, company, and overall day rating.
- Adding more attractions to an existing historical visit without creating a duplicate visit day.
- Recording ride laps and ride status.
- Rating rides and storing preferred rows or review notes.
- Automatically transitioning a planned park to visited when its first visit is recorded.

RideTracker distinguishes the **park visit** (`visit_days`) from each concrete **attraction experience** (`ride_logs`). This keeps day-level context separate from individual check-ins while allowing multiple experiences to belong to one historical visit.

### Live status and enrichment

Park and attraction data is assembled progressively from explicit source adapters:

- Queue-Times — catalog import and fallback live status.
- ThemeParks.wiki — primary live attraction status where park and attraction names match.
- Wikimedia — photos and contextual descriptions.
- Wikidata — structured metadata fallback.
- RCDB — roller-coaster-specific fallback data.

Source URLs are retained where applicable and live-status attribution is shown in the park inventory. Providers are queried through fail-soft adapters; unsupported or rate-limited sources do not block catalog usage.

### Mobile and offline mode

RideTracker is installable as a PWA and registers a service worker for the application shell. The in-park check-in flow is designed to remain useful when connectivity is unreliable:

- Ride check-ins are written to an IndexedDB queue when the browser is offline.
- Each queued request has an idempotent ID, so a retry cannot create a duplicate log.
- The queue synchronizes automatically when the browser reports connectivity again.
- The navigation bar shows offline state and pending check-ins.
- Check-ins do not wait for Queue-Times, ThemeParks.wiki, Wikimedia, or any other enrichment provider.

The offline boundary is deliberate: local ride-log capture is available offline, while catalog changes and external enrichment still require the authenticated server connection.

### Data and analytics

The dashboard now builds personal analytics from persisted visits, attraction experiences, ratings, laps, and live wait observations:

- Park and attraction rankings.
- Total visits, experiences, laps, and estimated wait exposure.
- Shortest and longest observed queues per attraction.
- Best-rated or most productive visit days.
- Visit comparisons using the same persisted day-level and attraction-level data.
- Authenticated JSON and CSV downloads at `/api/export?format=json` and `/api/export?format=csv`.

Wait history records the provider, observation time, open/closed state, and wait minutes. “Estimated wait” is based on observed queues; RideTracker does not claim time saved until actual queue duration is recorded.

### Map

The dashboard map uses Leaflet with public OpenStreetMap tiles. The application does not require a CARTO API key.

OpenStreetMap tile usage must respect the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/), especially for high-volume or public deployments.

## Data and persistence

The Docker Compose service mounts:

```text
./data:/app/data
```

The database file is:

```text
./data/coastervault.db
```

SQLite runs with WAL mode and foreign-key enforcement. On startup, RideTracker idempotently creates the baseline tables and applies non-destructive column migrations when the database file is new or already exists. Visit-day metadata includes duration, weather, company, and overall rating.

The enrichment queue stores durable `PENDING`, `PROCESSING`, `RETRY`, `DONE`, and `FAILED` states, attempt counts, next-attempt timestamps, and bounded error messages. The independent worker recovers stale processing jobs, applies bounded exponential backoff, and periodically scans for pending work.

- `parks`
- `rides`
- `visit_days`
- `ride_logs`
- `category_enrichment_jobs`

Back up the `data/` directory before upgrades or maintenance. To intentionally reset all local data, stop the stack and remove `data/coastervault.db`, `data/coastervault.db-wal`, and `data/coastervault.db-shm`. This is destructive and cannot be undone without a backup.

## Architecture

RideTracker uses a small Next.js App Router application with a local SQLite persistence layer.

```text
src/
├── app/                         # Routes, layout, login, and API handlers
├── actions/                     # Authenticated server actions
├── components/
│   ├── layout/                  # Global navigation
│   └── features/                # Dashboard, parks, visits, and rides UI
└── core/
    ├── auth/                    # Session token creation and validation
    ├── db/                      # SQLite connection, schema, repositories
    ├── domain/                  # Pure domain calculations and transitions
    ├── services/                # External source adapters and enrichment worker
    └── validators/              # Zod input validation
```

### Runtime flow

1. Next.js middleware checks the session cookie.
2. Protected pages redirect unauthenticated users to `/login`.
3. Server actions validate the session again before changing data.
4. Zod validates manual park and activity inputs.
5. Repository functions isolate Drizzle/SQLite access.
6. `revalidatePath` refreshes affected dashboard and catalog views.
7. The separate enrichment worker claims durable SQLite jobs and never depends on a web request to make progress.

### Docker image

The multi-stage `Dockerfile`:

1. Installs Alpine build tools for the native `better-sqlite3` module.
2. Installs dependencies with `npm ci`.
3. Builds a standalone Next.js production bundle.
4. Creates the `nextjs` UID 1001 runtime user.
5. Includes the worker runtime and source entrypoint alongside the standalone web bundle.
6. Uses `su-exec` to repair bind-mount ownership and drop privileges.

The image has been verified for `linux/amd64` and `linux/arm64` builds.

## Development

The recommended environment is Docker because `better-sqlite3` is a native module and requires a compatible compiler toolchain on non-Alpine hosts.

### Install dependencies

```bash
npm ci
```

On Windows, native `better-sqlite3` builds may require Visual Studio with the **Desktop development with C++** workload. Docker avoids that host dependency.

### Run the development server

```bash
npm run dev
```

Set `APP_SESSION_SECRET` and `DATABASE_URL` before starting the server. The default local database path is `./data/coastervault.db`.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create the optimized production build. |
| `npm run start` | Serve the production build. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite. |
| `npm run worker:enrichment` | Run the enrichment worker locally. |

Run the full validation suite in Docker when the host cannot compile `better-sqlite3`:

```powershell
$repo = (Get-Location).Path
docker run --rm -v "${repo}:/app" -w /app node:22-alpine sh -c "apk add --no-cache python3 make g++ >/dev/null && npm ci && npm run typecheck && npm run test && npm run build"
```

## Release and operational checks

Before considering a release ready:

```powershell
docker compose down
$env:APP_SESSION_SECRET = "generate-a-long-random-secret"
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 ridetracker
docker compose logs --tail 100 enrichment-worker
```

Verify the following manually:

- Login succeeds with the configured password.
- Dashboard and Parks pages load after authentication.
- Queue-Times search returns results.
- Importing a park creates the park and its rides.
- SQLite files remain under `./data`.
- The container process runs as UID 1001.
- Both Compose services report `healthy`.
- The worker heartbeat is updated at `./data/enrichment-worker.heartbeat`.
- Enrichment logs report completed and failed jobs as JSON events.

The v1.0.0 runtime baseline was measured at 38.61 MiB RAM, 151 ms maximum observed dashboard latency, and UID 1001 for the SQLite database/WAL files.

## Security notes

- `APP_SESSION_SECRET` is required and must be a long random value; it is separate from user login passwords.
- Session cookies are HTTP-only and use `SameSite=Lax`.
- The production container does not run the application process as root.
- API and server-action paths validate the session independently of page middleware.
- Keep the Docker host, Node base image, and npm dependencies patched.
- The production audit currently has one known high-severity direct `drizzle-orm` advisory whose available fix is a SemVer-major update; no breaking upgrade is applied automatically.

## License

No license has been declared yet. Until a license is added to this repository, all rights remain with the copyright holder.
