"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Loader2,
  Package,
  Plus,
  Refrigerator,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Warehouse,
  X,
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
  Select,
  Sheet,
  cx,
} from "@/components/ui";
import { CATEGORIES, CATEGORY_KEYS, categoryOf } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";
import { deleteProduct, resetAllData, resetAllStock, saveProduct } from "./actions";

const BULK_UNITS = ["dus", "karton", "krat", "galon", "pack", "sak"];
const RETAIL_UNITS = ["botol", "kaleng", "cup", "galon", "pcs", "sachet"];

export default function ProductsClient({
  products,
  isSuperAdmin,
}: {
  products: AdminProduct[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Produk</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Master produk, satuan, rasio konversi, dan harga.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a href="/admin/export/produk">
            <Button variant="outline">
              <Download size={17} />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </a>
          <Button onClick={() => setEditing("new")}>
            <Plus size={17} />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] font-semibold text-leaf">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <Card>
        <CardHeader
          title="Daftar Produk"
          description={`${products.length} produk terdaftar`}
          icon={<Package size={17} />}
        />
        <div className="p-4">
          <div className="relative mb-3">
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
              {list.map((p) => {
                const meta = categoryOf(p.category);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setEditing(p);
                      setSuccess(null);
                    }}
                    className={cx(
                      "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                      p.is_active
                        ? "border-line hover:border-coral/40 hover:bg-coral-soft"
                        : "border-line bg-cream opacity-60"
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        meta.chip
                      )}
                    >
                      <meta.icon size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">
                        {p.name}
                        {!p.is_active && " · nonaktif"}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-faint">
                        {formatRupiah(p.retail_price)} / {p.retail_unit} · 1 {p.bulk_unit} ={" "}
                        {p.conversion_ratio}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <Badge tone="neutral">
                        <Warehouse size={11} />
                        {p.warehouse_stock}
                      </Badge>
                      <Badge tone={p.showcase_stock === 0 ? "danger" : "leaf"}>
                        <Refrigerator size={11} />
                        {p.showcase_stock}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {isSuperAdmin && (
        <DangerZone
          productCount={products.length}
          onSuccess={(msg) => {
            setSuccess(msg);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <ProductSheet
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSuccess={(msg) => {
            setEditing(null);
            setSuccess(msg);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

const RESET_PHRASE = "RESET STOK";

const FULL_RESET_PHRASE = "HAPUS SEMUA DATA";

function DangerZone({
  productCount,
  onSuccess,
}: {
  productCount: number;
  onSuccess: (message: string) => void;
}) {
  return (
    <Card className="border-danger/30">
      <CardHeader
        title="Zona Berbahaya"
        description="Hanya untuk super admin. Tindakan di sini tidak bisa dibatalkan."
        icon={<ShieldAlert size={17} />}
      />
      <div className="divide-y divide-line">
        <div className="p-5">
          <DangerAction
            title="Reset Semua Stok"
            description={`Stok gudang & kulkas semua produk (${productCount}) diatur ulang ke 0. Harga dan data produk tidak berubah.`}
            warning={
              <>
                Ini akan mengatur stok gudang <b>dan</b> kulkas semua {productCount} produk
                menjadi 0. Riwayat transaksi/nota/opname tidak terhapus, tapi angka stok saat ini
                hilang dan harus dihitung ulang dari fisik.
              </>
            }
            confirmPhrase={RESET_PHRASE}
            buttonLabel="Reset"
            confirmLabel="Reset Sekarang"
            onConfirm={async () => {
              const result = await resetAllStock();
              if (!result.ok) {
                return { ok: false, message: result.message ?? "Gagal mereset stok." };
              }
              return { ok: true, message: `Stok ${result.count ?? 0} produk direset ke 0.` };
            }}
            onSuccess={onSuccess}
          />
        </div>

        <div className="p-5">
          <DangerAction
            title="Reset Semua Data Transaksi"
            description="Menghapus PERMANEN seluruh riwayat transaksi, mutasi stok, opname, nota pembelian, saldo/kasbon, dan rekonsiliasi kas. Stok & saldo warga ikut kembali ke 0."
            warning={
              <>
                Ini menghapus <b>seluruh riwayat operasional</b> — transaksi, mutasi stok,
                stock opname, nota pembelian, ledger saldo/kasbon, rekonsiliasi kas — dan
                menolkan semua stok serta saldo/kasbon warga. Master produk (nama/harga) dan
                akun pengguna (nama/username/peran) <b>tidak</b> ikut terhapus. Tidak bisa
                dibatalkan setelah dijalankan.
              </>
            }
            confirmPhrase={FULL_RESET_PHRASE}
            buttonLabel="Hapus Semua"
            confirmLabel="Hapus Permanen"
            onConfirm={async () => {
              const result = await resetAllData();
              if (!result.ok) {
                return { ok: false, message: result.message ?? "Gagal mereset data." };
              }
              const s = result.summary ?? {};
              return {
                ok: true,
                message: `Data direset: ${s.transactions ?? 0} transaksi, ${s.stock_transfers ?? 0} mutasi, ${s.stock_audits ?? 0} opname, ${s.purchase_invoices ?? 0} nota, ${s.balance_ledgers ?? 0} ledger, ${s.cash_reconciliations ?? 0} rekonsiliasi dihapus.`,
              };
            }}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </Card>
  );
}

function DangerAction({
  title,
  description,
  warning,
  confirmPhrase,
  buttonLabel,
  confirmLabel,
  onConfirm,
  onSuccess,
}: {
  title: string;
  description: string;
  warning: React.ReactNode;
  confirmPhrase: string;
  buttonLabel: string;
  confirmLabel: string;
  onConfirm: () => Promise<{ ok: boolean; message: string }>;
  onSuccess: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setPending(true);

    const result = await onConfirm();

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setOpen(false);
    setConfirmText("");
    onSuccess(result.message);
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">{description}</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)} className="shrink-0">
          <RotateCcw size={15} />
          {buttonLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert>{warning}</Alert>
      <Field label={`Ketik "${confirmPhrase}" untuk konfirmasi`}>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={confirmPhrase}
          autoFocus
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          size="sm"
          block
          onClick={() => {
            setOpen(false);
            setConfirmText("");
            setError(null);
          }}
        >
          Batal
        </Button>
        <Button
          variant="danger"
          size="sm"
          block
          disabled={pending || confirmText !== confirmPhrase}
          onClick={handleConfirm}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function ProductSheet({
  product,
  onClose,
  onSuccess,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState(product?.category ?? "air_mineral");
  const [bulkUnit, setBulkUnit] = useState(product?.bulk_unit ?? "dus");
  const [retailUnit, setRetailUnit] = useState(product?.retail_unit ?? "botol");
  const [ratio, setRatio] = useState(String(product?.conversion_ratio ?? 24));
  const [cost, setCost] = useState(String(product?.cost_price ?? ""));
  const [price, setPrice] = useState(String(product?.retail_price ?? ""));
  const [threshold, setThreshold] = useState(String(product?.min_showcase_threshold ?? 5));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const margin = Number(price || 0) - Number(cost || 0);

  async function handleDelete() {
    if (!product) return;
    setError(null);
    setDeleting(true);

    const result = await deleteProduct(product.id);

    setDeleting(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menghapus.");
      setConfirmDelete(false);
      return;
    }

    onSuccess(`${product.name} dihapus.`);
  }

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const result = await saveProduct({
      id: product?.id ?? null,
      sku,
      name,
      brand,
      category,
      bulkUnit,
      retailUnit,
      conversionRatio: Number(ratio || 1),
      costPrice: Number(cost || 0),
      retailPrice: Number(price || 0),
      minThreshold: Number(threshold || 0),
      isActive,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    onSuccess(product ? `${name} diperbarui.` : `${name} ditambahkan.`);
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-soft text-coral">
          <Package size={19} />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-ink">
            {product ? "Ubah Produk" : "Produk Baru"}
          </h2>
          <p className="text-[12px] text-ink-soft">{product?.name ?? "Lengkapi data produk"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition hover:bg-cream"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
        <Field label="Nama Produk">
          <Input
            autoFocus={!product}
            placeholder="mis. Teh Pucuk Harum 350ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Merek">
            <Input placeholder="mis. Mayora" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="SKU">
            <Input placeholder="opsional" value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
        </div>

        <Field label="Kategori">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_KEYS.map((key) => {
              const meta = CATEGORIES[key];
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cx(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition",
                    active
                      ? "border-coral bg-coral-soft text-coral-dark"
                      : "border-line text-ink-soft hover:border-coral/35"
                  )}
                >
                  <meta.icon size={16} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Satuan Besar">
            <Select value={bulkUnit} onChange={(e) => setBulkUnit(e.target.value)}>
              {BULK_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Satuan Ecer">
            <Select value={retailUnit} onChange={(e) => setRetailUnit(e.target.value)}>
              {RETAIL_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Isi per Besar">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Harga Modal / ecer">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
          <Field label="Harga Jual / ecer">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>

        {Number(price) > 0 && (
          <p
            className={cx(
              "rounded-xl px-4 py-2.5 text-[13px] font-medium",
              margin > 0 ? "bg-leaf-soft text-leaf" : "bg-danger-soft text-danger"
            )}
          >
            Margin per {retailUnit}: <b>{formatRupiah(margin)}</b>
            {margin <= 0 && " — harga jual belum menutup modal."}
          </p>
        )}

        <Field label="Batas Minimum Kulkas" hint="Muncul di peringatan restock bila stok di bawah ini.">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </Field>

        <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">Produk Aktif</span>
            <span className="text-[12px] text-ink-soft">Nonaktif berarti tidak tampil di kiosk.</span>
          </span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 accent-[#e2645b]"
          />
        </label>

        {error && <Alert>{error}</Alert>}

        <Button size="lg" block disabled={pending || !name.trim()} onClick={handleSubmit}>
          {pending ? <Loader2 size={18} className="animate-spin" /> : "Simpan Produk"}
        </Button>

        {product && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-center text-[13px] text-ink-soft">
                  Yakin hapus <b>{product.name}</b> permanen? Kalau produk ini sudah pernah
                  dipakai (transaksi/mutasi/nota), sistem akan menolak dan sarankan nonaktifkan
                  saja.
                </p>
                <div className="flex gap-2.5">
                  <Button variant="outline" size="sm" block onClick={() => setConfirmDelete(false)}>
                    Batal
                  </Button>
                  <Button variant="danger" size="sm" block disabled={deleting} onClick={handleDelete}>
                    {deleting ? <Loader2 size={15} className="animate-spin" /> : "Ya, Hapus"}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold text-danger transition hover:bg-danger-soft"
              >
                <Trash2 size={15} />
                Hapus Produk
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
