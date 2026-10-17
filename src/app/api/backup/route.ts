import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { exportBackup, importBackup } from "@/core/db/repositories";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/core/auth/session";
import { backupSchema, type BackupInput } from "@/core/validators/backup.schema";

async function requireBackupSession(): Promise<void> {
  if (!(await isValidSessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value))) throw new Error("Unauthorized");
}

export async function GET() {
  try {
    await requireBackupSession();
    return NextResponse.json(exportBackup());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

function toDate(value: string | number | Date): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid backup timestamp");
  return date;
}

export async function POST(request: Request) {
  try {
    await requireBackupSession();
    const backup = backupSchema.parse((await request.json()) as BackupInput);
    importBackup(backup, toDate);
    return NextResponse.json({ imported: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid backup" }, { status: 400 });
  }
}
