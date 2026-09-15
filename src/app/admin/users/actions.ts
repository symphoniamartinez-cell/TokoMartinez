"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function saveUser(input: {
  id: string | null;
  fullName: string;
  phone: string;
  username: string;
  role: Role;
  debtLimit: number;
  isActive: boolean;
  password: string;
  pin: string;
}): Promise<{ ok: boolean; message?: string }> {
  await requireRole(["superadmin"]);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_user", {
    p_token: await getToken(),
    p_id: input.id,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_username: input.username,
    p_role: input.role,
    p_debt_limit: input.debtLimit,
    p_is_active: input.isActive,
    p_password: input.password || null,
    p_pin: input.pin || null,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin/saldo");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function unlockUser(userId: string): Promise<{ ok: boolean; message?: string }> {
  await requireRole(["superadmin"]);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_unlock_user", {
    p_token: await getToken(),
    p_user_id: userId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}
