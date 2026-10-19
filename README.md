# RideTracker

RideTracker is a self-hosted personal theme-park and roller-coaster tracker. It combines a SQLite-backed catalog, park planning, visit history, ride logging, ratings, an interactive world map, and a production-ready Docker image.

The current release is designed for a single private instance: one master password protects the application and SQLite stores the data locally in `./data`.

## Quick start with Docker

### Requirements

- Docker Desktop with Docker Compose v2.
- A host port `3000` available.

### Start RideTracker

From the repository root:

```powershell
$env:APP_MASTER_PASSWORD = "change-this-password"
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The first request redirects to `/login`.

Check the container:

```powershell
docker compose ps
docker compose logs -f ridetracker
```

The application runs inside the container as the non-root user `nextjs` (UID 1001). SQLite data is persisted in the repository's `data/` directory.

### Stop the application

```powershell
docker compose down
```

Stopping the stack does not delete `./data`.

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `APP_MASTER_PASSWORD` | Yes | — | Password used by the login screen and session authentication. |
| `DATABASE_URL` | No | `/app/data/coastervault.db` in Docker | SQLite database path inside the container. |
| `QUEUE_TIMES_BASE_URL` | No | `https://queue-times.com` | Override the Queue-Times API base URL for testing or a compatible service. |
| `NODE_ENV` | No | `production` in Docker | Next.js runtime mode. |

Do not commit real passwords, `.env` files, SQLite data, or generated `.atl/` files. For repeatable local runs, set the password in the shell that invokes Compose or use a secrets manager in the deployment environment.

## Using the application

### Authentication

1. Open the application URL.
2. Enter `APP_MASTER_PASSWORD` on `/login`.
3. RideTracker creates an HTTP-only session cookie.

Unauthenticated page requests redirect to `/login`; unauthenticated API requests return `401 Unauthorized`.

### Main navigation

The global navigation provides:

- **Dashboard** (`/`) — season summary, KPIs, top rides, country summaries, and the world map.
- **Parks** (`/parks`) — searchable and filterable park catalog.

Additional routes are reached from catalog cards and visit history:

- `/parks/[id]` — park detail, ride inventory, notes, and visit history.
- `/visits/[id]` — visit detail and ride logging.

### Managing parks

From **Parks** you can:

- Search the Queue-Times catalog and import a park with its available rides.
- Add a park manually with name, country, city, latitude, longitude, and notes.
- Filter parks by `Wishlist`, `Planned`, or `Visited`.
- Open a park detail page to inspect rides and visits.

Queue-Times responses are validated and normalized. The integration accepts the current array-of-continents response format and numeric coordinates represented as strings.

### Visits and rides

Park detail pages provide the ride inventory and visit history. Visit workflows support:

- Creating and editing visit notes.
- Recording ride laps and ride status.
- Rating rides and storing preferred rows or review notes.
- Automatically transitioning a planned park to visited when its first visit is recorded.

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

SQLite runs with WAL mode and foreign-key enforcement. On startup, RideTracker idempotently creates the baseline tables when the database file is new or empty:

- `parks`
- `rides`
- `visit_days`
- `ride_logs`

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
    ├── services/                # Queue-Times integration
    └── validators/              # Zod input validation
```

### Runtime flow

1. Next.js middleware checks the session cookie.
2. Protected pages redirect unauthenticated users to `/login`.
3. Server actions validate the session again before changing data.
4. Zod validates manual park and activity inputs.
5. Repository functions isolate Drizzle/SQLite access.
6. `revalidatePath` refreshes affected dashboard and catalog views.

### Docker image

The multi-stage `Dockerfile`:

1. Installs Alpine build tools for the native `better-sqlite3` module.
2. Installs dependencies with `npm ci`.
3. Builds a standalone Next.js production bundle.
4. Creates the `nextjs` UID 1001 runtime user.
5. Uses `su-exec` to repair bind-mount ownership and drop privileges.

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

Set `APP_MASTER_PASSWORD` and `DATABASE_URL` before starting the server. The default local database path is `./data/coastervault.db`.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create the optimized production build. |
| `npm run start` | Serve the production build. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite. |

Run the full validation suite in Docker when the host cannot compile `better-sqlite3`:

```powershell
$repo = (Get-Location).Path
docker run --rm -v "${repo}:/app" -w /app node:22-alpine sh -c "apk add --no-cache python3 make g++ >/dev/null && npm ci && npm run typecheck && npm run test && npm run build"
```

## Release and operational checks

Before considering a release ready:

```powershell
docker compose down
$env:APP_MASTER_PASSWORD = "change-this-password"
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 ridetracker
```

Verify the following manually:

- Login succeeds with the configured password.
- Dashboard and Parks pages load after authentication.
- Queue-Times search returns results.
- Importing a park creates the park and its rides.
- SQLite files remain under `./data`.
- The container process runs as UID 1001.

The v1.0.0 runtime baseline was measured at 38.61 MiB RAM, 151 ms maximum observed dashboard latency, and UID 1001 for the SQLite database/WAL files.

## Security notes

- `APP_MASTER_PASSWORD` is required; never use the documented example value in production.
- Session cookies are HTTP-only and use `SameSite=Lax`.
- The production container does not run the application process as root.
- API and server-action paths validate the session independently of page middleware.
- Keep the Docker host, Node base image, and npm dependencies patched.
- The production audit currently has one known high-severity direct `drizzle-orm` advisory whose available fix is a SemVer-major update; no breaking upgrade is applied automatically.

## License

No license has been declared yet. Until a license is added to this repository, all rights remain with the copyright holder.
