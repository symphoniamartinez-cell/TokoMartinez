"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitRestock(input: {
  productId: string;
  bulkQuantity: number;
  staffId: string;
  pin: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("restock_transfer", {
    p_product_id: input.productId,
    p_bulk_quantity: input.bulkQuantity,
    p_staff_id: input.staffId,
    p_pin: input.pin,
    p_notes: input.notes ?? null,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/admin/restock");
  revalidatePath("/checkout");
  return { success: true as const };
}
