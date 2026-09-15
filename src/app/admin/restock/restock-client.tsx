"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Refrigerator,
  Search,
  Truck,
  Warehouse,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Stepper,
  cx,
} from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";
import { receiveStock, transferToShowcase } from "./actions";

type Mode = "receive" | "transfer";

export default function RestockClient({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("transfer");
  const [selected, setSelected] = useState<AdminProduct | null>(null);
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const reset = () => {
    setSelected(null);
    setQty(1);
    setCost("");
    setNotes("");
    setError(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    reset();
    setSuccess(null);
  };

  async function handleSubmit() {
    if (!selected) return;
    setError(null);
    setPending(true);

    const result =
      mode === "receive"
        ? await receiveStock({
            productId: selected.id,
            bulkQuantity: qty,
            totalCost: cost ? Number(cost) : 0,
            notes,
          })
        : await transferToShowcase({ productId: selected.id, bulkQuantity: qty, notes });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    setSuccess(
      mode === "receive"
        ? `${qty} ${selected.bulk_unit} ${selected.name} masuk ke gudang.`
        : `${qty * selected.conversion_ratio} ${selected.retail_unit} ${selected.name} masuk ke kulkas.`
    );
    reset();
    router.refresh();
  }

  const maxQty = mode === "transfer" ? selected?.warehouse_stock ?? 0 : 999;
  const overStock = mode === "transfer" && selected ? qty > selected.warehouse_stock : false;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Stok Masuk</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Catat barang belanjaan masuk gudang, lalu pindahkan ke kulkas showcase.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <ModeCard
          active={mode === "receive"}
          onClick={() => switchMode("receive")}
          icon={<Truck size={19} />}
          title="Terima ke Gudang"
          desc="Barang baru dibeli dari supplier"
        />
        <ModeCard
          active={mode === "transfer"}
          onClick={() => switchMode("transfer")}
          icon={<Refrigerator size={19} />}
          title="Gudang → Kulkas"
          desc="Isi ulang showcase agar dingin"
        />
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] font-semibold text-leaf">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <Card>
        <CardHeader
          title={mode === "receive" ? "Pilih Produk yang Diterima" : "Pilih Produk untuk Dipindah"}
          description={
            mode === "receive"
              ? "Stok gudang akan bertambah sesuai satuan besar."
              : "Stok gudang berkurang, stok kulkas bertambah otomatis sesuai rasio konversi."
          }
          icon={mode === "receive" ? <Warehouse size={17} /> : <Refrigerator size={17} />}
        />

        <div className="p-5">
          {selected ? (
            <div className="flex flex-col gap-4">
              <SelectedProduct product={selected} onClear={reset} />

              <Field label={`Jumlah (${selected.bulk_unit})`}>
                <div className="flex items-center gap-3">
                  <Stepper
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={maxQty > 0 ? maxQty : 999}
                    decIcon={<Minus size={16} />}
                    incIcon={<Plus size={16} />}
                  />
                  <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <ArrowRight size={14} />
                    <span className="font-semibold text-ink">
                      {qty * selected.conversion_ratio} {selected.retail_unit}
                    </span>
                    <span>{mode === "receive" ? "total eceran" : "ke kulkas"}</span>
                  </div>
                </div>
              </Field>

              {mode === "receive" && (
                <Field
                  label="Total Harga Beli (opsional)"
                  hint="Kalau diisi, harga modal per eceran ikut diperbarui otomatis."
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="mis. 96000"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                  {cost && Number(cost) > 0 && (
                    <span className="mt-1.5 block text-[12px] text-ink-faint">
                      Modal baru:{" "}
                      <b className="text-ink">
                        {formatRupiah(Number(cost) / (qty * selected.conversion_ratio))}
                      </b>{" "}
                      per {selected.retail_unit}
                    </span>
                  )}
                </Field>
              )}

              <Field label="Catatan (opsional)">
                <Input
                  placeholder={mode === "receive" ? "mis. beli di grosir A" : "mis. isi pagi"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>

              {overStock && <Alert>Jumlah melebihi stok gudang ({selected.warehouse_stock}).</Alert>}
              {error && <Alert>{error}</Alert>}

              <Button size="lg" block disabled={pending || overStock} onClick={handleSubmit}>
                {pending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : mode === "receive" ? (
                  "Simpan ke Gudang"
                ) : (
                  "Pindahkan ke Kulkas"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  placeholder="Cari produk..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {list.length === 0 ? (
                <EmptyState title="Produk tidak ditemukan" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {list.map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      disabled={mode === "transfer" && p.warehouse_stock <= 0}
                      onClick={() => {
                        setSelected(p);
                        setQty(1);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition",
        active
          ? "border-coral bg-coral-soft"
          : "border-line bg-surface hover:border-coral/35"
      )}
    >
      <span
        className={cx(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
          active ? "bg-coral text-white" : "bg-cream-deep text-ink-soft"
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">{desc}</span>
      </span>
    </button>
  );
}

function ProductRow({
  product,
  disabled,
  onClick,
}: {
  product: AdminProduct;
  disabled?: boolean;
  onClick: () => void;
}) {
  const meta = categoryOf(product.category);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left transition",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-coral/40 hover:bg-coral-soft"
      )}
    >
      <span className={cx("flex h-10 w-10 items-center justify-center rounded-lg", meta.chip)}>
        <meta.icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-ink">{product.name}</p>
        <p className="text-[11.5px] text-ink-faint">
          1 {product.bulk_unit} = {product.conversion_ratio} {product.retail_unit}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Badge tone="neutral">
          <Warehouse size={11} />
          {product.warehouse_stock}
        </Badge>
        <Badge tone={product.showcase_stock === 0 ? "danger" : "leaf"}>
          <Refrigerator size={11} />
          {product.showcase_stock}
        </Badge>
      </div>
    </button>
  );
}

function SelectedProduct({
  product,
  onClear,
}: {
  product: AdminProduct;
  onClear: () => void;
}) {
  const meta = categoryOf(product.category);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3">
      <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl", meta.chip)}>
        <meta.icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="text-[12px] text-ink-soft">
          Gudang {product.warehouse_stock} {product.bulk_unit} · Kulkas {product.showcase_stock}{" "}
          {product.retail_unit}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Ganti
      </Button>
    </div>
  );
}
