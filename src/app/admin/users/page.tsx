import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import UsersClient from "./users-client";

export const revalidate = 0;

export default async function UsersPage() {
  const session = await requireRole(["superadmin"]);
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", { p_token: await getToken() });

  return <UsersClient users={(data ?? []) as AdminUser[]} currentUserId={session.id} />;
}
