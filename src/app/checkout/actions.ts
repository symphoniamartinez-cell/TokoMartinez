"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import type { CustomerOption, PaymentMethod } from "@/lib/types";

export type AddCustomerResult =
  | { ok: true; customer: CustomerOption }
  | { ok: false; message: string };

export async function addCustomer(input: {
  fullName: string;
  phone: string;
  pin: string;
  debtLimit: number;
}): Promise<AddCustomerResult> {
  await requireStaff();

  if (!input.fullName.trim()) return { ok: false, message: "Nama wajib diisi." };
  if (input.pin && !/^\d{4}$/.test(input.pin)) {
    return { ok: false, message: "PIN harus 4 angka." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("staff_add_customer", {
    p_token: await getToken(),
    p_full_name: input.fullName,
    p_phone: input.phone || null,
    p_pin: input.pin || null,
    p_debt_limit: input.debtLimit,
  });

  if (error) return { ok: false, message: error.message };

  const row = data?.[0];
  if (!row) return { ok: false, message: "Gagal membuat akun." };

  revalidatePath("/checkout");
  revalidatePath("/admin/users");
  revalidatePath("/admin/saldo");
  return {
    ok: true,
    customer: {
      id: row.id as string,
      full_name: row.full_name as string,
      phone: input.phone || null,
    },
  };
}

export type AuthorizeResult =
  | { ok: true; token: string; deposit: number; debt: number; limit: number }
  | { ok: false; message: string };

export async function authorizePayment(
  customerId: string,
  pin: string
): Promise<AuthorizeResult> {
  if (!/^\d{4}$/.test(pin)) return { ok: false, message: "PIN harus 4 angka." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("authorize_payment", {
    p_customer_id: customerId,
    p_pin: pin,
  });

  if (error) return { ok: false, message: error.message };

  const row = data?.[0];
  if (!row?.ok) return { ok: false, message: row?.message ?? "PIN salah." };

  return {
    ok: true,
    token: row.token as string,
    deposit: Number(row.deposit_balance),
    debt: Number(row.debt_balance),
    limit: Number(row.debt_limit),
  };
}

export type CheckoutResult =
  | { ok: true; invoice: string; total: number }
  | { ok: false; message: string };

export async function submitCheckout(input: {
  customerId: string | null;
  method: PaymentMethod;
  authToken: string | null;
  items: { product_id: string; quantity: number }[];
}): Promise<CheckoutResult> {
  if (input.items.length === 0) return { ok: false, message: "Keranjang masih kosong." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkout_transaction", {
    p_customer_id: input.customerId,
    p_payment_method: input.method,
    p_auth_token: input.authToken,
    p_items: input.items,
  });

  if (error) return { ok: false, message: error.message };

  const row = data?.[0];
  if (!row) return { ok: false, message: "Transaksi gagal diproses." };

  revalidatePath("/checkout");
  revalidatePath("/admin");
  return { ok: true, invoice: row.invoice_number as string, total: Number(row.total_amount) };
}
