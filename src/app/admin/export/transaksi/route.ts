import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { formatRupiah } from "@/lib/format";
import type { TransactionExportRow } from "@/lib/types";

export async function GET(request: Request) {
  await requireStaff();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("mulai") ?? new Date().toISOString().slice(0, 10);
  const end = searchParams.get("sampai") ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_transactions", {
    p_token: await getToken(),
    p_start: start,
    p_end: end,
  });

  const rows = (data ?? []) as TransactionExportRow[];

  const csv = toCsv(
    ["No. Nota", "Tanggal", "Warga", "Metode Bayar", "Jumlah Item", "Total"],
    rows.map((r) => [
      r.invoice_number,
      new Date(r.tanggal).toLocaleString("id-ID"),
      r.nama_warga,
      r.metode_bayar,
      r.jumlah_item,
      formatRupiah(r.total),
    ])
  );

  return csvResponse(`transaksi_${start}_${end}.csv`, csv);
}
