import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import type { AdminProduct } from "@/lib/types";
import RestockClient from "./restock-client";

export const revalidate = 0;

export default async function RestockPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_products", { p_token: await getToken() });

  const products = ((data ?? []) as AdminProduct[]).filter((p) => p.is_active);

  return <RestockClient products={products} />;
}
