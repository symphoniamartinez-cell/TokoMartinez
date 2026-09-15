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

export type NotaItemInput = {
  productId: string;
  bulkQuantity: number;
  unitPrice: number;
  discountAmount: number;
};

export async function createPurchaseInvoice(input: {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  discountAmount: number;
  notes: string;
  items: NotaItemInput[];
}): Promise<Result> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_purchase_invoice", {
    p_token: await getToken(),
    p_supplier_name: input.supplierName || null,
    p_invoice_number: input.invoiceNumber || null,
    p_invoice_date: input.invoiceDate,
    p_notes: input.notes || null,
    p_discount_amount: input.discountAmount,
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      bulk_quantity: i.bulkQuantity,
      unit_price: i.unitPrice,
      discount_amount: i.discountAmount,
    })),
  });

  if (error) return { ok: false, message: error.message };
  await revalidateStock();
  revalidatePath("/admin/laporan");
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
