import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "tm_session";
const MAX_AGE = 60 * 60 * 12;

export async function getToken(): Promise<string> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? "";
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken();
  if (!token) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("session_profile", { p_token: token });
  if (error || !data || data.length === 0) return null;

  return data[0] as SessionUser;
});

export async function requireStaff(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(roles: SessionUser["role"][]): Promise<SessionUser> {
  const session = await requireStaff();
  if (!roles.includes(session.role)) redirect("/admin");
  return session;
}

export function canManageUsers(role: string) {
  return role === "superadmin";
}

export function canManageProducts(role: string) {
  return role === "admin" || role === "superadmin";
}
