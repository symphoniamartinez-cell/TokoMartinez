"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clearSessionCookie, getToken } from "@/lib/auth";

export async function logoutAction() {
  const token = await getToken();
  if (token) {
    const supabase = await createClient();
    await supabase.rpc("logout_session", { p_token: token });
  }
  await clearSessionCookie();
  redirect("/login");
}
