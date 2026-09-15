import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { CustomerOption, ProductWithStock } from "@/lib/types";
import CheckoutClient from "./checkout-client";

export const revalidate = 0;

export default async function CheckoutPage() {
  const session = await requireStaff();
  const supabase = await createClient();

  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase
      .from("products")
      .select("*, inventory(*)")
      .eq("is_active", true)
      .order("category")
      .order("name"),
    supabase.from("customer_directory").select("*").order("full_name"),
  ]);

  return (
    <CheckoutClient
      products={(products ?? []) as ProductWithStock[]}
      customers={(customers ?? []) as CustomerOption[]}
      staffName={session.full_name}
    />
  );
}
