import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: todayTx }, { data: lowStock }] = await Promise.all([
    supabase
      .from("transactions")
      .select("total_amount")
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("inventory")
      .select("showcase_stock, min_showcase_threshold, products(name)")
      .order("showcase_stock", { ascending: true }),
  ]);

  const todayTotal = (todayTx ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
  const lowStockItems = (lowStock ?? []).filter(
    (i) => i.showcase_stock < i.min_showcase_threshold
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Transaksi Hari Ini</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{todayTx?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Omzet Hari Ini</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(todayTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/restock"
          className="rounded-2xl bg-sky-600 p-4 text-white active:scale-95"
        >
          <p className="font-bold">Mutasi Stok</p>
          <p className="text-xs text-sky-100">Gudang → Kulkas</p>
        </Link>
        <Link
          href="/admin/stock-opname"
          className="rounded-2xl bg-slate-800 p-4 text-white active:scale-95"
        >
          <p className="font-bold">Stock Opname</p>
          <p className="text-xs text-slate-300">Audit Pagi / Malam</p>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-bold text-slate-800">Perlu Restock</p>
        {lowStockItems.length === 0 ? (
          <p className="text-xs text-slate-400">Semua stok showcase aman.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {lowStockItems.map((item, idx) => (
              <li key={idx} className="flex justify-between text-amber-700">
                {/* @ts-expect-error joined relation shape */}
                <span>{item.products?.name}</span>
                <span className="font-semibold">{item.showcase_stock} tersisa</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
