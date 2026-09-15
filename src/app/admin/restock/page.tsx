import { createClient } from "@/lib/supabase/server";
import type { ProductWithStock, Customer } from "@/lib/types";
import RestockClient from "./restock-client";

export const revalidate = 0;

export default async function RestockPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: staff }] = await Promise.all([
    supabase.from("products").select("*, inventory(*)").eq("is_active", true).order("name"),
    supabase.from("customer_directory").select("*").in("role", ["staff", "admin"]).order("full_name"),
  ]);

  return (
    <RestockClient
      products={(products ?? []) as ProductWithStock[]}
      staff={(staff ?? []) as Customer[]}
    />
  );
}
