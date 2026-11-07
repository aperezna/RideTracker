import type { RideCategory } from "@/core/db/schema";

export type AnalyticsVisit = {
  id: string;
  parkId: string;
  parkName: string;
  visitDate: string;
  durationMinutes: number | null;
  overallRating: number | null;
};

export type AnalyticsRide = {
  id: string;
  name: string;
  parkName: string;
  category: RideCategory;
  rating: number | null;
  preferredRow: string | null;
};

export type AnalyticsLog = {
  visitDayId: string;
  rideId: string;
  status: "RIDDEN" | "CLOSED";
  lapCount: number;
};

export type WaitObservation = {
  rideId: string;
  waitMinutes: number | null;
  observedAt: Date;
};

export type AnalyticsView = {
  totalVisits: number;
  totalExperiences: number;
  totalLaps: number;
  estimatedWaitMinutes: number;
  averageVisitRating: number | null;
  parkRankings: Array<{ parkName: string; visits: number; experiences: number; laps: number; averageRating: number | null }>;
  rideRankings: Array<{ rideId: string; rideName: string; parkName: string; experiences: number; laps: number; rating: number | null; preferredRow: string | null }>;
  waitByRide: Array<{ rideId: string; rideName: string; parkName: string; averageWait: number | null; shortestWait: number | null; longestWait: number | null; observations: number }>;
  bestDays: Array<{ visitId: string; parkName: string; visitDate: string; rating: number | null; experiences: number; laps: number }>;
};

function average(values: number[]): number | null {
  return values.length === 0 ? null : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function buildAnalytics(visits: AnalyticsVisit[], rides: AnalyticsRide[], logs: AnalyticsLog[], observations: WaitObservation[]): AnalyticsView {
  const rideById = new Map(rides.map((ride) => [ride.id, ride]));
  const logsByVisit = new Map<string, AnalyticsLog[]>();
  const logsByRide = new Map<string, AnalyticsLog[]>();
  for (const log of logs) {
    logsByVisit.set(log.visitDayId, [...(logsByVisit.get(log.visitDayId) ?? []), log]);
    logsByRide.set(log.rideId, [...(logsByRide.get(log.rideId) ?? []), log]);
  }
  const waitByRideId = new Map<string, number[]>();
  for (const observation of observations) {
    if (observation.waitMinutes !== null) waitByRideId.set(observation.rideId, [...(waitByRideId.get(observation.rideId) ?? []), observation.waitMinutes]);
  }
  const parkAccumulator = new Map<string, { parkName: string; visits: number; experiences: number; laps: number; ratings: number[] }>();
  for (const visit of visits) {
    const logsForVisit = logsByVisit.get(visit.id) ?? [];
    const accumulator = parkAccumulator.get(visit.parkId) ?? { parkName: visit.parkName, visits: 0, experiences: 0, laps: 0, ratings: [] };
    accumulator.visits += 1;
    accumulator.experiences += logsForVisit.filter((log) => log.status === "RIDDEN").length;
    accumulator.laps += logsForVisit.filter((log) => log.status === "RIDDEN").reduce((sum, log) => sum + log.lapCount, 0);
    if (visit.overallRating !== null) accumulator.ratings.push(visit.overallRating);
    parkAccumulator.set(visit.parkId, accumulator);
  }
  const rideRankings = [...logsByRide.entries()].map(([rideId, rideLogs]) => {
    const ride = rideById.get(rideId);
    const ridden = rideLogs.filter((log) => log.status === "RIDDEN");
    return { rideId, rideName: ride?.name ?? "Unknown attraction", parkName: ride?.parkName ?? "Unknown park", experiences: ridden.length, laps: ridden.reduce((sum, log) => sum + log.lapCount, 0), rating: ride?.rating ?? null, preferredRow: ride?.preferredRow ?? null };
  }).sort((left, right) => right.laps - left.laps || (right.rating ?? 0) - (left.rating ?? 0));
  const waitByRide = [...waitByRideId.entries()].map(([rideId, waits]) => {
    const ride = rideById.get(rideId);
    return { rideId, rideName: ride?.name ?? "Unknown attraction", parkName: ride?.parkName ?? "Unknown park", averageWait: average(waits), shortestWait: Math.min(...waits), longestWait: Math.max(...waits), observations: waits.length };
  }).sort((left, right) => (left.averageWait ?? Number.POSITIVE_INFINITY) - (right.averageWait ?? Number.POSITIVE_INFINITY));
  const bestDays = visits.map((visit) => {
    const ridden = (logsByVisit.get(visit.id) ?? []).filter((log) => log.status === "RIDDEN");
    return { visitId: visit.id, parkName: visit.parkName, visitDate: visit.visitDate, rating: visit.overallRating, experiences: ridden.length, laps: ridden.reduce((sum, log) => sum + log.lapCount, 0) };
  }).sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0) || right.laps - left.laps);
  const estimatedWaitMinutes = logs.filter((log) => log.status === "RIDDEN").reduce((sum, log) => sum + (average(waitByRideId.get(log.rideId) ?? []) ?? 0), 0);
  return {
    totalVisits: visits.length,
    totalExperiences: logs.filter((log) => log.status === "RIDDEN").length,
    totalLaps: logs.filter((log) => log.status === "RIDDEN").reduce((sum, log) => sum + log.lapCount, 0),
    estimatedWaitMinutes: Math.round(estimatedWaitMinutes),
    averageVisitRating: average(visits.flatMap((visit) => visit.overallRating === null ? [] : [visit.overallRating])),
    parkRankings: [...parkAccumulator.values()].map((park) => ({ ...park, averageRating: average(park.ratings) })).sort((left, right) => right.experiences - left.experiences || right.laps - left.laps),
    rideRankings,
    waitByRide,
    bestDays,
  };
}
