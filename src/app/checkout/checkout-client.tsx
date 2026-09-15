"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  Loader2,
  Lock,
  Minus,
  NotebookPen,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Snowflake,
  Wallet,
  X,
} from "lucide-react";
import { MartinezMark } from "@/components/brand";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Numpad,
  Sheet,
  Stepper,
  cx,
} from "@/components/ui";
import { CATEGORIES, CATEGORY_KEYS, categoryOf } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import type { CustomerOption, PaymentMethod, ProductWithStock } from "@/lib/types";
import { authorizePayment, submitCheckout } from "./actions";

type Props = { products: ProductWithStock[]; customers: CustomerOption[] };

export default function CheckoutClient({ products, customers }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.category === filter)),
    [products, filter]
  );

  const usedCategories = useMemo(
    () => CATEGORY_KEYS.filter((k) => products.some((p) => p.category === k)),
    [products]
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => ({ product: products.find((p) => p.id === id), quantity }))
        .filter((i): i is { product: ProductWithStock; quantity: number } => Boolean(i.product)),
    [cart, products]
  );

  const total = cartItems.reduce((s, i) => s + i.product.retail_price * i.quantity, 0);
  const count = cartItems.reduce((s, i) => s + i.quantity, 0);

  const setQty = (id: string, qty: number, max: number) =>
    setCart((prev) => ({ ...prev, [id]: Math.max(0, Math.min(qty, max)) }));

  return (
    <div className="flex flex-1 flex-col pb-32">
      <header className="petal-bg sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <MartinezMark className="h-10 w-10" />
            <div className="leading-tight">
              <h1 className="font-display text-[17px] font-semibold text-ink">Toko Martinez</h1>
              <p className="text-[12px] text-ink-soft">Ambil minumannya, catat sendiri di sini</p>
            </div>
          </div>
          <Link
            href="/login"
            title="Masuk sebagai petugas"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-faint transition hover:bg-surface hover:text-coral"
          >
            <ShieldCheck size={19} />
          </Link>
        </div>

        {usedCategories.length > 1 && (
          <div className="no-scrollbar mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
              Semua
            </FilterChip>
            {usedCategories.map((key) => {
              const meta = CATEGORIES[key];
              return (
                <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
                  <meta.icon size={14} />
                  {meta.short}
                </FilterChip>
              );
            })}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        {visible.length === 0 ? (
          <EmptyState
            icon={<ShoppingBasket size={34} />}
            title="Belum ada produk"
            description="Produk pada kategori ini belum tersedia."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={cart[product.id] ?? 0}
                onChange={(n) => setQty(product.id, n, product.inventory?.showcase_stock ?? 0)}
              />
            ))}
          </div>
        )}
      </main>

      {count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                <ShoppingBasket size={14} />
                {count} item
              </p>
              <p className="font-display text-xl font-semibold text-ink">{formatRupiah(total)}</p>
            </div>
            <Button size="lg" onClick={() => setSheetOpen(true)} className="px-8">
              Bayar
            </Button>
          </div>
        </div>
      )}

      {sheetOpen && (
        <PaymentSheet
          items={cartItems}
          total={total}
          customers={customers}
          onClose={() => setSheetOpen(false)}
          onDone={() => {
            setCart({});
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition",
        active ? "bg-coral text-white shadow-sm shadow-coral/25" : "bg-surface text-ink-soft"
      )}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  qty,
  onChange,
}: {
  product: ProductWithStock;
  qty: number;
  onChange: (n: number) => void;
}) {
  const meta = categoryOf(product.category);
  const stock = product.inventory?.showcase_stock ?? 0;
  const habis = stock <= 0;

  return (
    <div
      className={cx(
        "flex flex-col rounded-2xl border bg-surface p-3.5 transition",
        habis ? "border-line opacity-60" : "border-line hover:border-coral/35"
      )}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl", meta.chip)}>
          <meta.icon size={20} />
        </span>
        {!habis && (
          <Badge tone="coral">
            <Snowflake size={11} />
            Dingin
          </Badge>
        )}
      </div>

      <p className="text-[13.5px] font-semibold leading-snug text-ink">{product.name}</p>
      <p className="mt-0.5 text-[11.5px] text-ink-faint">
        {product.brand} · per {product.retail_unit}
      </p>

      <p className="mt-2.5 font-display text-lg font-semibold text-ink">
        {formatRupiah(product.retail_price)}
      </p>
      <p className={cx("text-[11.5px]", stock <= 5 && !habis ? "text-gold-dark" : "text-ink-faint")}>
        {habis ? "Stok kosong" : `Sisa ${stock} ${product.retail_unit}`}
      </p>

      <div className="mt-3">
        {qty === 0 ? (
          <Button size="sm" block disabled={habis} onClick={() => onChange(1)}>
            {habis ? "Habis" : "Tambah"}
          </Button>
        ) : (
          <Stepper
            value={qty}
            onChange={onChange}
            max={stock}
            decIcon={<Minus size={16} />}
            incIcon={<Plus size={16} />}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Payment sheet ------------------------------ */

type Step = "method" | "qris" | "pick" | "pin" | "confirm" | "done";
type Balance = { deposit: number; debt: number; limit: number };

function PaymentSheet({
  items,
  total,
  customers,
  onClose,
  onDone,
}: {
  items: { product: ProductWithStock; quantity: number }[];
  total: number;
  customers: CustomerOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod>("qris");
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [query, setQuery] = useState("");
  const [pin, setPin] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [invoice, setInvoice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const payload = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? customers.filter((c) => c.full_name.toLowerCase().includes(q)) : customers;
    return list.slice(0, 60);
  }, [customers, query]);

  async function verifyPin(nextPin: string) {
    if (!customer) return;
    setPending(true);
    setError(null);

    const result = await authorizePayment(customer.id, nextPin);
    setPending(false);
    setPin("");

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setAuthToken(result.token);
    setBalance({ deposit: result.deposit, debt: result.debt, limit: result.limit });
    setStep("confirm");
  }

  async function pay(payMethod: PaymentMethod) {
    setPending(true);
    setError(null);

    const result = await submitCheckout({
      customerId: payMethod === "deposit" || payMethod === "debt" ? customer?.id ?? null : null,
      method: payMethod,
      authToken: payMethod === "deposit" || payMethod === "debt" ? authToken : null,
      items: payload,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setInvoice(result.invoice);
    setStep("done");
  }

  const startAccountFlow = (m: PaymentMethod) => {
    setMethod(m);
    setError(null);
    setStep("pick");
  };

  const shortfall = balance ? balance.deposit - total : 0;
  const remainingLimit = balance ? balance.limit - balance.debt : 0;

  return (
    <Sheet onClose={step === "done" ? onDone : onClose}>
      {step === "done" ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-soft">
            <CheckCircle2 size={44} className="text-leaf" />
          </span>
          <h2 className="mt-2 font-display text-xl font-semibold text-ink">Terima kasih!</h2>
          <p className="text-sm text-ink-soft">Transaksi kamu sudah tercatat.</p>
          <div className="mt-3 w-full rounded-2xl bg-cream px-4 py-3 text-left">
            <Row label="No. Nota" value={invoice} mono />
            <Row label="Total" value={formatRupiah(total)} strong />
          </div>
          <Button size="lg" block onClick={onDone} className="mt-3">
            Selesai
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            {step !== "method" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setPin("");
                  setStep(step === "confirm" ? "pin" : step === "pin" ? "pick" : "method");
                }}
                className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-cream"
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <div className="flex-1">
              <h2 className="font-display text-base font-semibold text-ink">
                {step === "method" && "Pilih Pembayaran"}
                {step === "qris" && "QRIS / Tunai"}
                {step === "pick" && "Pilih Nama Warga"}
                {step === "pin" && "Masukkan PIN"}
                {step === "confirm" && "Konfirmasi"}
              </h2>
              <p className="text-[12px] text-ink-soft">
                Total {formatRupiah(total)} · {items.length} jenis
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint transition hover:bg-cream"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {step === "method" && (
              <div className="flex flex-col gap-2.5">
                <MethodOption
                  icon={<QrCode size={21} />}
                  title="QRIS / Tunai"
                  desc="Scan QRIS toko atau bayar tunai ke petugas"
                  onClick={() => {
                    setMethod("qris");
                    setStep("qris");
                  }}
                />
                <MethodOption
                  icon={<Wallet size={21} />}
                  title="Potong Saldo Deposit"
                  desc="Pakai saldo yang sudah di-top up"
                  onClick={() => startAccountFlow("deposit")}
                />
                <MethodOption
                  icon={<NotebookPen size={21} />}
                  title="Ambil Dulu (Kasbon)"
                  desc="Dicatat sebagai tagihan, dibayar nanti"
                  onClick={() => startAccountFlow("debt")}
                />
              </div>
            )}

            {step === "qris" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-cream text-ink-faint">
                  <QrCode size={40} />
                  <span className="text-[12px] font-medium">QRIS Toko Martinez</span>
                </div>
                <p className="max-w-xs text-center text-[13px] leading-relaxed text-ink-soft">
                  Scan QRIS di atas, atau serahkan uang tunai ke petugas, lalu tekan tombol
                  konfirmasi sesuai cara bayarmu.
                </p>
                {error && <Alert>{error}</Alert>}
                <div className="flex w-full gap-2.5">
                  <Button
                    variant="outline"
                    size="lg"
                    block
                    disabled={pending}
                    onClick={() => pay("cash")}
                  >
                    <Banknote size={18} />
                    Tunai
                  </Button>
                  <Button size="lg" block disabled={pending} onClick={() => pay("qris")}>
                    {pending ? <Loader2 size={18} className="animate-spin" /> : "Sudah Bayar QRIS"}
                  </Button>
                </div>
              </div>
            )}

            {step === "pick" && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
                  <Input
                    autoFocus
                    placeholder="Cari nama warga..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filtered.length === 0 ? (
                  <EmptyState title="Nama tidak ditemukan" description="Coba kata kunci lain." />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomer(c);
                          setPin("");
                          setError(null);
                          setStep("pin");
                        }}
                        className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left transition hover:border-coral/40 hover:bg-coral-soft"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[13px] font-bold text-ink-soft">
                          {c.full_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-semibold text-ink">{c.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === "pin" && customer && (
              <div className="flex flex-col items-center">
                <Badge tone="neutral" className="mb-4">
                  <Lock size={11} />
                  {customer.full_name}
                </Badge>

                {error && (
                  <div className="mb-4 w-full">
                    <Alert>{error}</Alert>
                  </div>
                )}

                {pending ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-coral" />
                  </div>
                ) : (
                  <div className="w-full max-w-[280px]">
                    <Numpad
                      value={pin}
                      onChange={(next) => {
                        setPin(next);
                        if (next.length === 4) void verifyPin(next);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {step === "confirm" && customer && balance && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-coral-soft px-4 py-3">
                  <BadgeCheck size={20} className="text-coral" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{customer.full_name}</p>
                    <p className="text-[12px] text-ink-soft">PIN terverifikasi</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-cream px-4 py-3">
                  {method === "deposit" ? (
                    <>
                      <Row label="Saldo saat ini" value={formatRupiah(balance.deposit)} />
                      <Row label="Total belanja" value={`- ${formatRupiah(total)}`} />
                      <div className="my-2 border-t border-line" />
                      <Row
                        label="Sisa saldo"
                        value={formatRupiah(Math.max(shortfall, 0))}
                        strong
                      />
                    </>
                  ) : (
                    <>
                      <Row label="Kasbon saat ini" value={formatRupiah(balance.debt)} />
                      <Row label="Transaksi ini" value={`+ ${formatRupiah(total)}`} />
                      <div className="my-2 border-t border-line" />
                      <Row label="Total kasbon" value={formatRupiah(balance.debt + total)} strong />
                      <Row label="Plafon" value={formatRupiah(balance.limit)} />
                    </>
                  )}
                </div>

                {method === "deposit" && shortfall < 0 && (
                  <Alert>
                    Saldo kurang {formatRupiah(Math.abs(shortfall))}. Top up dulu ke petugas atau
                    pilih metode lain.
                  </Alert>
                )}
                {method === "debt" && balance.debt + total > balance.limit && (
                  <Alert>
                    Melebihi plafon kasbon. Sisa plafon {formatRupiah(Math.max(remainingLimit, 0))}.
                  </Alert>
                )}
                {error && <Alert>{error}</Alert>}

                <Button
                  size="lg"
                  block
                  disabled={
                    pending ||
                    (method === "deposit" && shortfall < 0) ||
                    (method === "debt" && balance.debt + total > balance.limit)
                  }
                  onClick={() => pay(method)}
                >
                  {pending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : method === "deposit" ? (
                    "Potong Saldo Sekarang"
                  ) : (
                    "Catat Kasbon"
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

function MethodOption({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-2xl border border-line px-4 py-3.5 text-left transition hover:border-coral/45 hover:bg-coral-soft"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">{desc}</span>
      </span>
    </button>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span
        className={cx(
          "text-[13px] font-semibold text-ink",
          strong && "font-display text-[15px]",
          mono && "font-mono text-[12px]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
