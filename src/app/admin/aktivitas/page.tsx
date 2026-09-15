import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import type { ActivityLogRow, BackupRow } from "@/lib/types";
import AktivitasClient from "./aktivitas-client";

export const revalidate = 0;

export default async function AktivitasPage() {
  await requireRole(["superadmin"]);
  const supabase = await createClient();
  const token = await getToken();

  const [{ data: log }, { data: backups }] = await Promise.all([
    supabase.rpc("admin_list_activity", { p_token: token, p_limit: 100 }),
    supabase.rpc("admin_list_backups", { p_token: token }),
  ]);

  return (
    <AktivitasClient
      log={(log ?? []) as ActivityLogRow[]}
      backups={(backups ?? []) as BackupRow[]}
    />
  );
}
