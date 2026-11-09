#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${RIDE_TRACKER_DIR:-$HOME/ridetracker}"
APP_URL="${RIDE_TRACKER_URL:-http://localhost:3000}"

if [[ -z "${APP_MASTER_PASSWORD:-}" ]]; then
  echo "APP_MASTER_PASSWORD must be set in the server shell." >&2
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "RideTracker checkout not found at $APP_DIR." >&2
  echo "Clone the repository there first, then rerun this script." >&2
  exit 1
fi

cd "$APP_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "The server checkout has uncommitted changes; refusing to overwrite them." >&2
  git status --short
  exit 1
fi

git pull --ff-only
docker compose build
docker compose up -d

for attempt in {1..18}; do
  if docker compose ps --status running | grep -q "ridetracker-ridetracker" \
    && curl --fail --silent --show-error "$APP_URL" >/dev/null; then
    docker compose ps
    echo "RideTracker is available at $APP_URL"
    exit 0
  fi
  sleep 5
done

docker compose ps
docker compose logs --tail=80 ridetracker enrichment-worker
echo "RideTracker did not become healthy in time." >&2
exit 1
