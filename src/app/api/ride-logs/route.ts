import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createRideLogRecord } from "@/core/db/repositories";
import { rideLogSchema } from "@/core/validators/ride-log.schema";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";

export async function POST(request: Request): Promise<NextResponse> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSessionToken(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const log = rideLogSchema.parse(await request.json());
    const id = log.id ?? crypto.randomUUID();
    createRideLogRecord({ ...log, id });
    revalidatePath("/");
    revalidatePath(`/visits/${log.visitDayId}`);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid ride log" }, { status: 400 });
  }
}
