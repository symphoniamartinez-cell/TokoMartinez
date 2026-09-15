import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import type { AdminProduct } from "@/lib/types";
import ProductsClient from "./products-client";

export const revalidate = 0;

export default async function ProductsPage() {
  const session = await requireRole(["admin", "superadmin"]);
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_products", { p_token: await getToken() });

  return (
    <ProductsClient
      products={(data ?? []) as AdminProduct[]}
      isSuperAdmin={session.role === "superadmin"}
    />
  );
}
