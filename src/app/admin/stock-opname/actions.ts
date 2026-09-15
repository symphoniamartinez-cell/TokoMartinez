"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";

export async function submitStockAudit(input: {
  session: "morning" | "night";
  audits: { product_id: string; physical_stock: number }[];
}): Promise<{ ok: boolean; message?: string; loss?: number }> {
  await requireStaff();

  if (input.audits.length === 0) {
    return { ok: false, message: "Isi minimal satu stok fisik." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_stock_audit", {
    p_token: await getToken(),
    p_session: input.session,
    p_audits: input.audits,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin");
  revalidatePath("/checkout");
  return { ok: true, loss: Number(data ?? 0) };
}
