import {
  claimNextRideCategoryJob,
  completeRideCategoryJob,
  getPendingRideEnrichmentParkIds,
  preparePendingRideEnrichmentJobs,
  recoverAllStaleRideCategoryJobs,
  recoverStaleRideCategoryJobs,
  retryRideCategoryJob,
  clearEnrichmentFailure,
  isEnrichmentCoolingDown,
  recordEnrichmentFailure,
  recordRideFieldSources,
  updateRideEnrichmentRecord,
} from "@/core/db/repositories";
import { getRideEnrichment } from "./wikimedia.service";

const activeParks = new Set<string>();
const MAX_ATTEMPTS = 3;
const INTERVAL_MS = 5_000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function startCategoryEnrichmentWorker(parkId: string): void {
  if (activeParks.has(parkId)) return;
  activeParks.add(parkId);
  void processCategoryEnrichmentQueue(parkId)
    .catch((error: unknown) => {
      console.error(JSON.stringify({ event: "enrichment_park_worker_failed", parkId, error: error instanceof Error ? error.message : "unknown error" }));
    })
    .finally(() => activeParks.delete(parkId));
}

export async function runCategoryEnrichmentWorker(onHeartbeat?: () => void): Promise<void> {
  recoverAllStaleRideCategoryJobs();
  preparePendingRideEnrichmentJobs();
  console.info(JSON.stringify({ event: "enrichment_worker_started", pollIntervalMs: 15_000 }));
  while (true) {
    for (const parkId of getPendingRideEnrichmentParkIds()) startCategoryEnrichmentWorker(parkId);
    onHeartbeat?.();
    await wait(15_000);
  }
}

async function processCategoryEnrichmentQueue(parkId: string): Promise<void> {
  recoverStaleRideCategoryJobs(parkId);
  while (true) {
    const job = claimNextRideCategoryJob(parkId);
    if (!job) return;
    try {
      const scopeKey = job.rideId;
      if (isEnrichmentCoolingDown("catalog-enrichment", scopeKey)) {
        retryRideCategoryJob(job, "Enrichment source cooldown active", MAX_ATTEMPTS);
        continue;
      }
      const enrichment = await getRideEnrichment(job.rideName, job.parkName, "en");
      if (!enrichment?.category && !enrichment?.photoUrl && !enrichment?.experience && !enrichment?.storytelling) throw new Error("No ride enrichment source provided data");
      updateRideEnrichmentRecord(job.rideId, enrichment.category, enrichment.photoUrl, enrichment.sourceUrl, enrichment.experience, enrichment.storytelling);
      const source = enrichment.sourceUrl?.includes("wikidata") ? "Wikidata" : enrichment.sourceUrl?.includes("rcdb") ? "RCDB" : "Wikimedia";
      recordRideFieldSources(job.rideId, [
        ...(enrichment.category ? [{ field: "category", source, sourceUrl: enrichment.sourceUrl }] : []),
        ...(enrichment.photoUrl ? [{ field: "photo", source, sourceUrl: enrichment.sourceUrl }] : []),
        ...(enrichment.experience ? [{ field: "experience", source, sourceUrl: enrichment.sourceUrl }] : []),
        ...(enrichment.storytelling ? [{ field: "storytelling", source, sourceUrl: enrichment.sourceUrl }] : []),
      ]);
      clearEnrichmentFailure("catalog-enrichment", scopeKey);
      completeRideCategoryJob(job.id);
      console.info(JSON.stringify({ event: "enrichment_job_completed", ride: job.rideName, park: job.parkName, category: enrichment.category ?? null, photo: Boolean(enrichment.photoUrl) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      recordEnrichmentFailure("catalog-enrichment", job.rideId, message);
      retryRideCategoryJob(job, message, MAX_ATTEMPTS);
      console.warn(JSON.stringify({ event: "enrichment_job_failed", ride: job.rideName, park: job.parkName, attempt: job.attempts + 1, maxAttempts: MAX_ATTEMPTS, error: message }));
    }
    await wait(INTERVAL_MS);
  }
}
