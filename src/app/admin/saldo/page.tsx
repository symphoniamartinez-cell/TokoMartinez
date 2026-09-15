import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import SaldoClient from "./saldo-client";

export const revalidate = 0;

export default async function SaldoPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", { p_token: await getToken() });

  const customers = ((data ?? []) as AdminUser[]).filter(
    (u) => u.role === "customer" && u.is_active
  );

  return <SaldoClient customers={customers} />;
}
