import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import type { CashReconciliation, StockMovementRow } from "@/lib/types";
import RekonsiliasiClient from "./rekonsiliasi-client";

export const revalidate = 0;

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default async function RekonsiliasiPage({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string }>;
}) {
  await requireStaff();
  const { tanggal } = await searchParams;
  const date = tanggal || todayJakarta();

  const supabase = await createClient();
  const token = await getToken();

  const [{ data: cash }, { data: movement }] = await Promise.all([
    supabase.rpc("admin_cash_reconciliation", { p_token: token, p_date: date }),
    supabase.rpc("admin_stock_movement", { p_token: token, p_date: date }),
  ]);

  return (
    <RekonsiliasiClient
      date={date}
      cash={(cash?.[0] ?? null) as CashReconciliation | null}
      movement={(movement ?? []) as StockMovementRow[]}
    />
  );
}
