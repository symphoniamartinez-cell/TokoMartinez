"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import type { ProductWithStock, Customer } from "@/lib/types";
import { submitRestock } from "./actions";

export default function RestockClient({
  products,
  staff,
}: {
  products: ProductWithStock[];
  staff: Customer[];
}) {
  const [productId, setProductId] = useState("");
  const [bulkQty, setBulkQty] = useState(1);
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const product = products.find((p) => p.id === productId);
  const warehouseStock = product?.inventory?.warehouse_stock ?? 0;
  const retailAdded = product ? bulkQty * product.conversion_ratio : 0;

  async function handleSubmit() {
    setError(null);
    if (!productId || !staffId || pin.length !== 4 || bulkQty < 1) {
      setError("Lengkapi produk, jumlah, petugas, dan PIN 4 digit.");
      return;
    }
    if (bulkQty > warehouseStock) {
      setError("Jumlah melebihi stok gudang.");
      return;
    }

    setSubmitting(true);
    const result = await submitRestock({ productId, bulkQuantity: bulkQty, staffId, pin, notes });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    setProductId("");
    setBulkQty(1);
    setPin("");
    setNotes("");
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-500">Pilih Minuman</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
        >
          <option value="">Pilih produk...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {product && (
          <div className="mt-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
            <p>
              1 {product.bulk_unit} = {product.conversion_ratio} {product.retail_unit}
            </p>
            <p>
              Sisa di gudang: <b>{warehouseStock} {product.bulk_unit}</b>
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-500">
          Jumlah {product?.bulk_unit ?? "dus"} yang dipindah
        </label>
        <input
          type="number"
          min={1}
          value={bulkQty}
          onChange={(e) => setBulkQty(Math.max(1, Number(e.target.value)))}
          className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-lg font-bold"
        />
        {product && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            {bulkQty} {product.bulk_unit}
            <ArrowRight size={12} />
            <b className="text-slate-700">
              {retailAdded} {product.retail_unit}
            </b>{" "}
            ke Showcase
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-500">Petugas</label>
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
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
        <input
          type="text"
          placeholder="Catatan (opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm"
        />
      </div>

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      <button
        disabled={submitting}
        onClick={handleSubmit}
        className="rounded-xl bg-sky-600 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="mx-auto animate-spin" size={18} />
        ) : done ? (
          <span className="flex items-center justify-center gap-1">
            <CheckCircle2 size={16} /> Berhasil Dipindahkan
          </span>
        ) : (
          "Pindahkan ke Kulkas"
        )}
      </button>
    </div>
  );
}
