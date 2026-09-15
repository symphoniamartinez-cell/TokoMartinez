"use server";

import { createClient } from "@/lib/supabase/server";
import { setSessionCookie } from "@/lib/auth";

type LoginResult = { ok: boolean; message: string };

export async function loginAction(username: string, password: string): Promise<LoginResult> {
  if (!username.trim() || !password) {
    return { ok: false, message: "Username dan kata sandi wajib diisi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("login_staff", {
    p_username: username,
    p_password: password,
  });

  if (error) return { ok: false, message: error.message };

  const row = data?.[0];
  if (!row?.ok) return { ok: false, message: row?.message ?? "Gagal masuk." };

  await setSessionCookie(row.token as string);
  return { ok: true, message: "ok" };
}
