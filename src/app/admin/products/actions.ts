"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";

export async function saveProduct(input: {
  id: string | null;
  sku: string;
  name: string;
  brand: string;
  category: string;
  bulkUnit: string;
  retailUnit: string;
  conversionRatio: number;
  costPrice: number;
  retailPrice: number;
  minThreshold: number;
  isActive: boolean;
}): Promise<{ ok: boolean; message?: string }> {
  await requireRole(["admin", "superadmin"]);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_product", {
    p_token: await getToken(),
    p_id: input.id,
    p_sku: input.sku,
    p_name: input.name,
    p_brand: input.brand,
    p_category: input.category,
    p_bulk_unit: input.bulkUnit,
    p_retail_unit: input.retailUnit,
    p_conversion_ratio: input.conversionRatio,
    p_cost_price: input.costPrice,
    p_retail_price: input.retailPrice,
    p_min_threshold: input.minThreshold,
    p_is_active: input.isActive,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin/restock");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireRole(["admin", "superadmin"]);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_product", {
    p_token: await getToken(),
    p_product_id: id,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin/restock");
  revalidatePath("/checkout");
  return { ok: true };
}
