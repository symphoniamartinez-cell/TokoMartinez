import { createClient } from "@/lib/supabase/server";
import type { ProductWithStock, Customer } from "@/lib/types";
import CheckoutClient from "./checkout-client";

export const revalidate = 0;

export default async function CheckoutPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select("*, inventory(*)")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("customer_directory")
      .select("*")
      .eq("role", "customer")
      .order("full_name"),
  ]);

  return (
    <CheckoutClient
      products={(products ?? []) as ProductWithStock[]}
      customers={(customers ?? []) as Customer[]}
    />
  );
}
