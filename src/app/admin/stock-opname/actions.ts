"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitStockAudit(input: {
  session: "morning" | "night";
  staffId: string;
  pin: string;
  audits: { product_id: string; physical_stock: number; notes?: string }[];
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_stock_audit", {
    p_session: input.session,
    p_staff_id: input.staffId,
    p_pin: input.pin,
    p_audits: input.audits,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/stock-opname");
  revalidatePath("/checkout");
  revalidatePath("/admin");
  return { success: true as const };
}
