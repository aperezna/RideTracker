"use client";

import type { RideLogInput } from "@/core/validators/ride-log.schema";

type QueuedRideCheckIn = RideLogInput & { id: string };
type DeliveryResult = { status: "synced" | "queued"; id: string };

const DATABASE_NAME = "ridetracker-offline";
const STORE_NAME = "ride-checkins";
const QUEUE_EVENT = "ridetracker:offline-queue";

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline queue"));
  });
}

function emitQueueChange(): void {
  window.dispatchEvent(new Event(QUEUE_EVENT));
}

async function enqueue(input: QueuedRideCheckIn): Promise<void> {
  const database = await openQueue();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(input);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not queue ride check-in"));
  });
  database.close();
  emitQueueChange();
}

async function queuedItems(): Promise<QueuedRideCheckIn[]> {
  const database = await openQueue();
  return await new Promise<QueuedRideCheckIn[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => { database.close(); resolve(request.result as QueuedRideCheckIn[]); };
    request.onerror = () => { database.close(); reject(request.error ?? new Error("Could not read offline queue")); };
  });
}

async function removeQueued(id: string): Promise<void> {
  const database = await openQueue();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not update offline queue"));
  });
  database.close();
}

async function send(input: QueuedRideCheckIn): Promise<Response> {
  return fetch("/api/ride-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || !navigator.onLine;
}

export async function submitRideCheckIn(input: RideLogInput): Promise<DeliveryResult> {
  const queuedInput: QueuedRideCheckIn = { ...input, id: input.id ?? crypto.randomUUID() };
  if (!navigator.onLine) {
    await enqueue(queuedInput);
    return { status: "queued", id: queuedInput.id };
  }
  try {
    const response = await send(queuedInput);
    if (!response.ok) throw new Error(`Ride check-in failed with status ${response.status}`);
    return { status: "synced", id: queuedInput.id };
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await enqueue(queuedInput);
    return { status: "queued", id: queuedInput.id };
  }
}

export async function syncPendingRideCheckIns(): Promise<number> {
  if (!navigator.onLine) return 0;
  let synced = 0;
  for (const item of await queuedItems()) {
    try {
      const response = await send(item);
      if (response.ok) {
        await removeQueued(item.id);
        synced += 1;
        emitQueueChange();
      } else if (response.status >= 400 && response.status < 500 && response.status !== 401) {
        await removeQueued(item.id);
        emitQueueChange();
      }
    } catch (error) {
      if (isNetworkError(error)) break;
    }
  }
  return synced;
}

export async function getPendingRideCheckInCount(): Promise<number> {
  return (await queuedItems()).length;
}

export const offlineQueueEventName = QUEUE_EVENT;
