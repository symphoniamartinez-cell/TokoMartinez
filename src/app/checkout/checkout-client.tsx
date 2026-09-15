"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart, X, Snowflake, Loader2, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ProductWithStock, Customer, PaymentMethod } from "@/lib/types";
import { submitCheckout } from "./actions";

type Props = {
  products: ProductWithStock[];
  customers: Customer[];
};

type Cart = Record<string, number>;

export default function CheckoutClient({ products, customers }: Props) {
  const [cart, setCart] = useState<Cart>({});
  const [modalOpen, setModalOpen] = useState(false);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({
          product: products.find((p) => p.id === productId)!,
          quantity: qty,
        }))
        .filter((item) => item.product),
    [cart, products]
  );

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.retail_price * item.quantity,
    0
  );
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function setQty(productId: string, qty: number, max: number) {
    setCart((prev) => ({ ...prev, [productId]: Math.max(0, Math.min(qty, max)) }));
  }

  function resetCart() {
    setCart({});
  }

  return (
    <div className="flex flex-1 flex-col pb-28">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-sky-700">Toko Martinez</h1>
        <p className="text-xs text-slate-500">Ambil minuman, catat sendiri di sini</p>
      </header>

      <main className="grid flex-1 grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {products.map((product) => {
          const stock = product.inventory?.showcase_stock ?? 0;
          const qty = cart[product.id] ?? 0;
          const outOfStock = stock <= 0;

          return (
            <div
              key={product.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-1 text-[11px] font-medium text-sky-600">
                <Snowflake size={13} /> Dingin di Kulkas
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug text-slate-800">
                  {product.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sisa {stock} {product.retail_unit}
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {formatRupiah(product.retail_price)}
                </p>
              </div>

              {qty === 0 ? (
                <button
                  disabled={outOfStock}
                  onClick={() => setQty(product.id, 1, stock)}
                  className="mt-3 rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white active:scale-95 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {outOfStock ? "Habis" : "Tambah"}
                </button>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-sky-50 p-1">
                  <button
                    onClick={() => setQty(product.id, qty - 1, stock)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sky-700 shadow active:scale-95"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-sm font-bold text-sky-800">{qty}</span>
                  <button
                    disabled={qty >= stock}
                    onClick={() => setQty(product.id, qty + 1, stock)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sky-700 shadow active:scale-95 disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {itemCount > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
        >
          <div>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <ShoppingCart size={14} /> {itemCount} item
            </p>
            <p className="text-lg font-bold text-slate-900">{formatRupiah(total)}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white active:scale-95"
          >
            Bayar
          </button>
        </div>
      )}

      {modalOpen && (
        <PaymentModal
          cartItems={cartItems}
          total={total}
          customers={customers}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            resetCart();
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  cartItems,
  total,
  customers,
  onClose,
  onSuccess,
}: {
  cartItems: { product: ProductWithStock; quantity: number }[];
  total: number;
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<"qris_cash" | "deposit" | "debt">("qris_cash");
  const [customerId, setCustomerId] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function pay(method: PaymentMethod) {
    setError(null);

    if ((method === "deposit" || method === "debt") && (!customerId || pin.length !== 4)) {
      setError("Pilih nama warga dan masukkan PIN 4 digit.");
      return;
    }

    setSubmitting(true);
    const result = await submitCheckout({
      customerId: method === "deposit" || method === "debt" ? customerId : null,
      paymentMethod: method,
      pin,
      items: cartItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(true);
    setTimeout(onSuccess, 1200);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <CheckCircle2 className="text-emerald-500" size={56} />
            <p className="text-lg font-bold text-slate-800">Transaksi Selesai</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Pembayaran</h2>
              <button onClick={onClose} className="text-slate-400">
                <X size={22} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <div className="flex justify-between text-sm font-semibold text-slate-700">
                <span>Total Bayar</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="mb-4 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {[
                { key: "qris_cash", label: "QRIS / Tunai" },
                { key: "deposit", label: "Potong Saldo" },
                { key: "debt", label: "Ambil Dulu" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`flex-1 rounded-lg py-2 ${
                    tab === t.key ? "bg-white text-sky-700 shadow" : "text-slate-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "qris_cash" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400">
                  QRIS Toko Martinez
                </div>
                <p className="text-xs text-slate-500">
                  Scan QRIS di atas, atau bayar tunai langsung ke petugas, lalu konfirmasi.
                </p>
                <div className="flex w-full gap-2">
                  <button
                    disabled={submitting}
                    onClick={() => pay("cash")}
                    className="flex-1 rounded-xl border border-sky-600 py-3 text-sm font-bold text-sky-700 active:scale-95 disabled:opacity-50"
                  >
                    Bayar Tunai
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => pay("qris")}
                    className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Konfirmasi Bayar"}
                  </button>
                </div>
              </div>
            )}

            {(tab === "deposit" || tab === "debt") && (
              <div className="flex flex-col gap-3 py-2">
                {tab === "debt" && (
                  <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                    Nilai transaksi akan ditambahkan ke tagihan (kasbon) kamu.
                  </p>
                )}
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <option value="">Pilih nama warga...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
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
                  className="rounded-xl border border-slate-200 p-3 text-center text-lg tracking-[0.5em]"
                />
                <button
                  disabled={submitting}
                  onClick={() => pay(tab)}
                  className="rounded-xl bg-sky-600 py-3 text-sm font-bold text-white active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="mx-auto animate-spin" size={18} />
                  ) : tab === "deposit" ? (
                    "Potong Saldo"
                  ) : (
                    "Catat Kasbon"
                  )}
                </button>
              </div>
            )}

            {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
