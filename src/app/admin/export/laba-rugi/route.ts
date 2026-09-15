import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import type { ProfitLossByProduct } from "@/lib/types";

export async function GET(request: Request) {
  await requireRole(["admin", "superadmin"]);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("mulai") ?? new Date().toISOString().slice(0, 10);
  const end = searchParams.get("sampai") ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_profit_loss_by_product", {
    p_token: await getToken(),
    p_start: start,
    p_end: end,
  });

  const rows = (data ?? []) as ProfitLossByProduct[];

  const csv = toCsv(
    ["Produk", "Terjual", "Omzet", "HPP", "Margin"],
    rows.map((r) => [r.product_name, r.qty_sold, r.revenue, r.cogs, r.margin])
  );

  return csvResponse(`laba_rugi_${start}_${end}.csv`, csv);
}
