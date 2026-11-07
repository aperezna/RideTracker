import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAnalyticsExportData } from "@/core/db/analytics";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(data: ReturnType<typeof getAnalyticsExportData>): string {
  const parkNames = new Map(data.parks.map((park) => [park.id, park.name]));
  const rideMap = new Map(data.rides.map((ride) => [ride.id, ride]));
  const visitMap = new Map(data.visitDays.map((visit) => [visit.id, visit]));
  const waitMap = new Map(data.analytics.waitByRide.map((wait) => [wait.rideId, wait.averageWait]));
  const header = ["visit_date", "park", "attraction", "status", "laps", "rating", "preferred_row", "average_observed_wait_minutes"];
  const rows = data.rideLogs.map((log) => {
    const visit = visitMap.get(log.visitDayId);
    const ride = rideMap.get(log.rideId);
    return [visit?.visitDate, parkNames.get(visit?.parkId ?? ""), ride?.name, log.status, log.lapCount, ride?.rating, ride?.preferredRow, waitMap.get(log.rideId)];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function GET(request: Request): Promise<NextResponse> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const data = getAnalyticsExportData();
  if (format === "csv") {
    return new NextResponse(toCsv(data), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=ridetracker-analytics.csv" } });
  }
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=ridetracker-analytics.json" } });
}
