import { NextResponse } from "next/server";

import { requireCurrentUserId } from "@/core/auth/current-user";
import { applyImportPlan, buildImportPlan, parseCsvImport, parseImportRows, summarizeImportPlan } from "@/core/imports/importer";

const MAX_IMPORT_BYTES = 2_000_000;
type ImportRequest = { format?: unknown; mode?: unknown; content?: unknown };

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await requireCurrentUserId();
    const body = (await request.json()) as ImportRequest;
    if (typeof body.content !== "string" || body.content.length > MAX_IMPORT_BYTES) return NextResponse.json({ error: "Import file is missing or too large" }, { status: 400 });
    if (body.format !== "csv" && body.format !== "json") return NextResponse.json({ error: "Unsupported import format" }, { status: 400 });
    if (body.mode !== "preview" && body.mode !== "apply") return NextResponse.json({ error: "Unsupported import mode" }, { status: 400 });
    const rows = body.format === "csv" ? parseCsvImport(body.content) : parseImportRows(JSON.parse(body.content));
    const plan = buildImportPlan(rows, userId);
    if (body.mode === "preview") return NextResponse.json({ summary: summarizeImportPlan(plan), warnings: plan.warnings, errors: plan.errors });
    if (plan.errors.length > 0) return NextResponse.json({ summary: summarizeImportPlan(plan), warnings: plan.warnings, errors: plan.errors }, { status: 400 });
    return NextResponse.json({ imported: applyImportPlan(plan) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 400 });
  }
}
