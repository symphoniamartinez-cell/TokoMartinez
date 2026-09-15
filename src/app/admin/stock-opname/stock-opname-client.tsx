"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Sun, Moon } from "lucide-react";
import type { ProductWithStock, Customer } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { submitStockAudit } from "./actions";

export default function StockOpnameClient({
  products,
  staff,
}: {
  products: ProductWithStock[];
  staff: Customer[];
}) {
  const [session, setSession] = useState<"morning" | "night">("morning");
  const [physical, setPhysical] = useState<Record<string, number | "">>({});
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setValue(productId: string, value: string) {
    setPhysical((prev) => ({
      ...prev,
      [productId]: value === "" ? "" : Math.max(0, Number(value)),
    }));
  }

  function statusFor(product: ProductWithStock) {
    const systemStock = product.inventory?.showcase_stock ?? 0;
    const val = physical[product.id];
    if (val === "" || val === undefined) return { color: "bg-slate-100 text-slate-400", label: "-" };
    const diff = val - systemStock;
    if (diff === 0) return { color: "bg-emerald-100 text-emerald-700", label: "Aman" };
    if (diff < 0) return { color: "bg-red-100 text-red-700", label: `${diff}` };
    return { color: "bg-amber-100 text-amber-700", label: `+${diff}` };
  }

  const estimatedLoss = products.reduce((sum, p) => {
    const systemStock = p.inventory?.showcase_stock ?? 0;
    const val = physical[p.id];
    if (val === "" || val === undefined) return sum;
    const diff = val - systemStock;
    return diff < 0 ? sum + Math.abs(diff) * p.cost_price : sum;
  }, 0);

  async function handleSubmit() {
    setError(null);
    const audits = products
      .filter((p) => physical[p.id] !== "" && physical[p.id] !== undefined)
      .map((p) => ({ product_id: p.id, physical_stock: Number(physical[p.id]) }));

    if (audits.length === 0) {
      setError("Isi minimal satu stok fisik.");
      return;
    }
    if (!staffId || pin.length !== 4) {
      setError("Pilih petugas dan masukkan PIN 4 digit.");
      return;
    }

    setSubmitting(true);
    const result = await submitStockAudit({ session, staffId, pin, audits });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    setPhysical({});
    setPin("");
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setSession("morning")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 ${
            session === "morning" ? "bg-white text-sky-700 shadow" : "text-slate-500"
          }`}
        >
          <Sun size={15} /> Pagi
        </button>
        <button
          onClick={() => setSession("night")}
          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 ${
            session === "night" ? "bg-white text-sky-700 shadow" : "text-slate-500"
          }`}
        >
          <Moon size={15} /> Malam
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-3">Produk</th>
              <th className="p-3 text-center">Sistem</th>
              <th className="p-3 text-center">Fisik</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const status = statusFor(p);
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-700">{p.name}</td>
                  <td className="p-3 text-center text-slate-500">
                    {p.inventory?.showcase_stock ?? 0}
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={physical[p.id] ?? ""}
                      onChange={(e) => setValue(p.id, e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 p-1 text-center"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {estimatedLoss > 0 && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Estimasi kerugian: <b>{formatRupiah(estimatedLoss)}</b>
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm"
        >
          <option value="">Pilih petugas...</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="PIN 4 digit"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-center text-lg tracking-[0.5em]"
        />
      </div>

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      <button
        disabled={submitting}
        onClick={handleSubmit}
        className="rounded-xl bg-slate-800 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="mx-auto animate-spin" size={18} />
        ) : done ? (
          <span className="flex items-center justify-center gap-1">
            <CheckCircle2 size={16} /> Stok Disesuaikan
          </span>
        ) : (
          "Submit & Sesuaikan Stok"
        )}
      </button>
    </div>
  );
}
