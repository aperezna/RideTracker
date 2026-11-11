import { ImportCenter } from "@/components/features/imports/ImportCenter";
import { requireCurrentUserId } from "@/core/auth/current-user";
import { getRequestLocale } from "@/core/i18n/server";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireCurrentUserId();
  return <ImportCenter locale={await getRequestLocale()} />;
}
