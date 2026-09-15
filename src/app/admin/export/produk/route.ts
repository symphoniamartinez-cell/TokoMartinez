import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { CATEGORIES } from "@/lib/categories";
import type { AdminProduct } from "@/lib/types";

export async function GET() {
  await requireRole(["admin", "superadmin"]);

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_products", { p_token: await getToken() });

  const rows = (data ?? []) as AdminProduct[];

  const csv = toCsv(
    [
      "Nama",
      "SKU",
      "Merek",
      "Kategori",
      "Satuan Besar",
      "Satuan Ecer",
      "Rasio Konversi",
      "Harga Modal",
      "Harga Jual",
      "Stok Gudang",
      "Stok Kulkas",
      "Aktif",
    ],
    rows.map((p) => [
      p.name,
      p.sku ?? "",
      p.brand,
      CATEGORIES[p.category as keyof typeof CATEGORIES]?.label ?? p.category,
      p.bulk_unit,
      p.retail_unit,
      p.conversion_ratio,
      p.cost_price,
      p.retail_price,
      p.warehouse_stock,
      p.showcase_stock,
      p.is_active ? "Ya" : "Tidak",
    ])
  );

  return csvResponse(`produk_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
