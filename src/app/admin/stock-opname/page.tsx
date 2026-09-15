import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import type { AdminProduct } from "@/lib/types";
import StockOpnameClient from "./stock-opname-client";

export const revalidate = 0;

export default async function StockOpnamePage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_products", { p_token: await getToken() });

  const products = ((data ?? []) as AdminProduct[]).filter((p) => p.is_active);

  // Sesi default mengikuti jam toko (WIB), bukan jam perangkat petugas.
  const jakartaHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  return (
    <StockOpnameClient
      products={products}
      defaultSession={jakartaHour < 15 ? "morning" : "night"}
    />
  );
}
