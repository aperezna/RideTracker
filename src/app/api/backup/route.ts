import { NextResponse } from "next/server";

import { exportBackup, importBackup } from "@/core/db/repositories";
import { requireCurrentUserId } from "@/core/auth/current-user";
import { backupSchema, type BackupInput } from "@/core/validators/backup.schema";

const requireBackupSession = requireCurrentUserId;

export async function GET() {
  try {
    const userId = await requireBackupSession();
    return NextResponse.json(exportBackup(userId));
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
    const userId = await requireBackupSession();
    const backup = backupSchema.parse((await request.json()) as BackupInput);
    importBackup(backup, userId, toDate);
    return NextResponse.json({ imported: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid backup" }, { status: 400 });
  }
}
