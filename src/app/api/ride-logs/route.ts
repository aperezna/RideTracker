import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createRideLogRecord } from "@/core/db/repositories";
import { rideLogSchema } from "@/core/validators/ride-log.schema";
import { requireCurrentUserId } from "@/core/auth/current-user";

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireCurrentUserId();
  try {
    const log = rideLogSchema.parse(await request.json());
    const id = log.id ?? crypto.randomUUID();
    createRideLogRecord({ ...log, id }, userId);
    revalidatePath("/");
    revalidatePath(`/visits/${log.visitDayId}`);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid ride log" }, { status: 400 });
  }
}
