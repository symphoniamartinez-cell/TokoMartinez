"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";

type Result = { ok: boolean; message?: string };

async function revalidateStock() {
  revalidatePath("/admin/restock");
  revalidatePath("/admin/stock-opname");
  revalidatePath("/admin");
  revalidatePath("/checkout");
}

export async function receiveStock(input: {
  productId: string;
  bulkQuantity: number;
  totalCost: number;
  notes: string;
}): Promise<Result> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.rpc("receive_stock", {
    p_token: await getToken(),
    p_product_id: input.productId,
    p_bulk_quantity: input.bulkQuantity,
    p_total_cost: input.totalCost,
    p_notes: input.notes || null,
  });

  if (error) return { ok: false, message: error.message };
  await revalidateStock();
  return { ok: true };
}

export async function transferToShowcase(input: {
  productId: string;
  bulkQuantity: number;
  notes: string;
}): Promise<Result> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.rpc("restock_transfer", {
    p_token: await getToken(),
    p_product_id: input.productId,
    p_bulk_quantity: input.bulkQuantity,
    p_notes: input.notes || null,
  });

  if (error) return { ok: false, message: error.message };
  await revalidateStock();
  return { ok: true };
}
