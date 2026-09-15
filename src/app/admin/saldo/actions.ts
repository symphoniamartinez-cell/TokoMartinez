"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";

export async function adjustBalance(input: {
  customerId: string;
  type: "topup_deposit" | "pay_debt";
  amount: number;
  paymentMethod: "cash" | "qris";
  notes: string;
}): Promise<{ ok: boolean; message?: string }> {
  await requireStaff();

  if (!input.amount || input.amount <= 0) {
    return { ok: false, message: "Nominal harus lebih dari 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_customer_balance", {
    p_token: await getToken(),
    p_customer_id: input.customerId,
    p_type: input.type,
    p_amount: input.amount,
    p_notes: input.notes || null,
    p_payment_method: input.paymentMethod,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/saldo");
  revalidatePath("/admin");
  revalidatePath("/admin/rekonsiliasi");
  return { ok: true };
}
