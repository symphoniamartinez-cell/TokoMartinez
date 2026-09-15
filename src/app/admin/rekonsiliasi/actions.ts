"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";

export async function submitCashCount(input: {
  date: string;
  physicalCash: number;
  notes: string;
}): Promise<{ ok: boolean; message?: string; difference?: number }> {
  await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_cash_reconciliation", {
    p_token: await getToken(),
    p_date: input.date,
    p_physical_cash: input.physicalCash,
    p_notes: input.notes || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/rekonsiliasi");
  return { ok: true, difference: Number(data ?? 0) };
}
