"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";
import { createPurchaseInvoice, type NotaItemInput } from "./actions";

type Line = {
  key: string;
  productId: string;
  bulkQty: string;
  unitPrice: string;
  discount: string;
};

function emptyLine(): Line {
  return { key: crypto.randomUUID(), productId: "", bulkQty: "1", unitPrice: "", discount: "0" };
}

export default function NotaForm({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const subtotal = lines.reduce((sum, l) => {
    const qty = Number(l.bulkQty || 0);
    const price = Number(l.unitPrice || 0);
    const disc = Number(l.discount || 0);
    return sum + Math.max(qty * price - disc, 0);
  }, 0);
  const invoiceDisc = Number(invoiceDiscount || 0);
  const total = Math.max(subtotal - invoiceDisc, 0);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  const validLines = lines.filter(
    (l) => l.productId && Number(l.bulkQty) > 0 && Number(l.unitPrice) >= 0
  );
  const canSubmit = validLines.length > 0 && validLines.length === lines.length;

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const items: NotaItemInput[] = lines.map((l) => ({
      productId: l.productId,
      bulkQuantity: Number(l.bulkQty),
      unitPrice: Number(l.unitPrice),
      discountAmount: Number(l.discount || 0),
    }));

    const result = await createPurchaseInvoice({
      supplierName,
      invoiceNumber,
      invoiceDate,
      discountAmount: invoiceDisc,
      notes,
      items,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan nota.");
      return;
    }

    setSuccess(`Nota tersimpan, ${lines.length} produk masuk gudang. HPP rata-rata ikut diperbarui.`);
    setSupplierName("");
    setInvoiceNumber("");
    setInvoiceDiscount("0");
    setNotes("");
    setLines([emptyLine()]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] font-semibold text-leaf">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nama Supplier (opsional)">
          <Input
            placeholder="mis. Grosir Sumber Rejeki"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </Field>
        <Field label="No. Nota (opsional)">
          <Input
            placeholder="mis. INV-2381"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </Field>
        <Field label="Tanggal Nota">
          <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        {lines.map((line, idx) => {
          const product = productById.get(line.productId);
          const qty = Number(line.bulkQty || 0);
          const price = Number(line.unitPrice || 0);
          const disc = Number(line.discount || 0);
          const lineTotal = Math.max(qty * price - disc, 0);

          return (
            <div key={line.key} className="rounded-2xl border border-line bg-cream p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
                  Item {idx + 1}
                </span>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <select
                    value={line.productId}
                    onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/12"
                  >
                    <option value="">Pilih produk...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.bulk_unit})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder={`Jumlah ${product?.bulk_unit ?? ""}`}
                  value={line.bulkQty}
                  onChange={(e) => updateLine(line.key, { bulkQty: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Harga/satuan"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                />
              </div>

              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-4">
                <div className="sm:col-span-2 sm:col-start-3">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Diskon item (opsional)"
                    value={line.discount}
                    onChange={(e) => updateLine(line.key, { discount: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-end text-[13px] text-ink-soft">
                  {product && qty > 0 && (
                    <span>
                      = {qty * product.conversion_ratio} {product.retail_unit} ·{" "}
                      <b className="text-ink">{formatRupiah(lineTotal)}</b>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={addLine} className="self-start">
          <Plus size={15} />
          Tambah Item
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Diskon Total Nota (opsional)" hint="Diprorata otomatis ke tiap item.">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={invoiceDiscount}
            onChange={(e) => setInvoiceDiscount(e.target.value)}
          />
        </Field>
        <Field label="Catatan (opsional)">
          <Input placeholder="mis. bayar tunai" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>

      <div className="rounded-2xl bg-cream px-4 py-3">
        <div className="flex justify-between text-[13px] text-ink-soft">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-ink-soft">
          <span>Diskon Nota</span>
          <span>- {formatRupiah(invoiceDisc)}</span>
        </div>
        <div className="my-2 border-t border-line" />
        <div className="flex justify-between font-display text-base font-semibold text-ink">
          <span>Total Dibayar</span>
          <span>{formatRupiah(total)}</span>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <Button size="lg" block disabled={pending || !canSubmit} onClick={handleSubmit}>
        {pending ? <Loader2 size={18} className="animate-spin" /> : "Simpan Nota"}
      </Button>
    </div>
  );
}
