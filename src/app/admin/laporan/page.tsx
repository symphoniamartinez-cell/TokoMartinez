import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import type { ProfitLoss, ProfitLossByProduct } from "@/lib/types";
import LaporanClient from "./laporan-client";

export const revalidate = 0;

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function firstOfMonthJakarta() {
  const today = todayJakarta();
  return `${today.slice(0, 7)}-01`;
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ mulai?: string; sampai?: string }>;
}) {
  await requireRole(["admin", "superadmin"]);
  const { mulai, sampai } = await searchParams;
  const start = mulai || firstOfMonthJakarta();
  const end = sampai || todayJakarta();

  const supabase = await createClient();
  const token = await getToken();

  const [{ data: summary }, { data: byProduct }] = await Promise.all([
    supabase.rpc("admin_profit_loss", { p_token: token, p_start: start, p_end: end }),
    supabase.rpc("admin_profit_loss_by_product", { p_token: token, p_start: start, p_end: end }),
  ]);

  return (
    <LaporanClient
      start={start}
      end={end}
      summary={(summary?.[0] ?? null) as ProfitLoss | null}
      byProduct={(byProduct ?? []) as ProfitLossByProduct[]}
    />
  );
}
