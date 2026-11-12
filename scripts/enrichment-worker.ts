import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { runCategoryEnrichmentWorker } from "@/core/services/category-enrichment.worker";
import { getWaitTimePollingTargets } from "@/core/db/repositories";
import { pollWaitTimeObservations } from "@/core/services/wait-time-polling.service";

const heartbeatPath = process.env.ENRICHMENT_HEARTBEAT_PATH ?? "/app/data/enrichment-worker.heartbeat";
let stopping = false;

async function writeHeartbeat(): Promise<void> {
  await mkdir(dirname(heartbeatPath), { recursive: true });
  await writeFile(heartbeatPath, `${new Date().toISOString()}\n`);
}

function requestShutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  console.info(JSON.stringify({ event: "enrichment_worker_stopping", signal }));
  process.exit(0);
}

process.on("SIGTERM", () => requestShutdown("SIGTERM"));
process.on("SIGINT", () => requestShutdown("SIGINT"));

async function main(): Promise<void> {
  let nextWaitTimePollAt = 0;
  await runCategoryEnrichmentWorker(() => {
    void writeHeartbeat().catch((error: unknown) => {
      console.error(JSON.stringify({ event: "enrichment_worker_heartbeat_failed", error: error instanceof Error ? error.message : "unknown error" }));
    });
    if (Date.now() < nextWaitTimePollAt) return;
    nextWaitTimePollAt = Date.now() + 10 * 60_000;
    void pollWaitTimeObservations(getWaitTimePollingTargets())
      .then((result) => console.info(JSON.stringify({ event: "wait_time_poll_completed", ...result })))
      .catch((error: unknown) => console.warn(JSON.stringify({ event: "wait_time_poll_failed", error: error instanceof Error ? error.message : "unknown error" })));
  });
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({ event: "enrichment_worker_fatal", error: error instanceof Error ? error.message : "unknown error" }));
  process.exitCode = 1;
});
