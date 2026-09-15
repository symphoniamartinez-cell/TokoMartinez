"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type CheckoutInput = {
  customerId: string | null;
  paymentMethod: "qris" | "deposit" | "debt" | "cash";
  pin: string;
  items: { product_id: string; quantity: number }[];
};

export async function submitCheckout(input: CheckoutInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("checkout_transaction", {
    p_customer_id: input.customerId,
    p_payment_method: input.paymentMethod,
    p_pin: input.pin,
    p_items: input.items,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/checkout");
  return { success: true as const, transactionId: data as string };
}
