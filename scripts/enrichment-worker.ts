import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { runCategoryEnrichmentWorker } from "@/core/services/category-enrichment.worker";

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
  await runCategoryEnrichmentWorker(() => {
    void writeHeartbeat().catch((error: unknown) => {
      console.error(JSON.stringify({ event: "enrichment_worker_heartbeat_failed", error: error instanceof Error ? error.message : "unknown error" }));
    });
  });
}

void main().catch((error: unknown) => {
  console.error(JSON.stringify({ event: "enrichment_worker_fatal", error: error instanceof Error ? error.message : "unknown error" }));
  process.exitCode = 1;
});
