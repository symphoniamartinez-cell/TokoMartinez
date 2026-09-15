"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  HandCoins,
  Loader2,
  NotebookPen,
  QrCode,
  Search,
  Wallet,
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
  Sheet,
  cx,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import { adjustBalance } from "./actions";

const PRESETS = [20000, 50000, 100000, 200000];

export default function SaldoClient({ customers }: { customers: AdminUser[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<AdminUser | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? customers.filter((c) => c.full_name.toLowerCase().includes(q)) : customers;
  }, [customers, query]);

  const totalDeposit = customers.reduce((s, c) => s + Number(c.deposit_balance), 0);
  const totalDebt = customers.reduce((s, c) => s + Number(c.debt_balance), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Saldo &amp; Kasbon</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Terima top up deposit warga dan catat pelunasan kasbon.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-soft text-leaf">
            <Wallet size={17} />
          </span>
          <p className="mt-3 text-[12px] text-ink-soft">Total Deposit</p>
          <p className="font-display text-lg font-semibold text-ink">
            {formatRupiah(totalDeposit)}
          </p>
        </Card>
        <Card className="p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-soft text-coral">
            <NotebookPen size={17} />
          </span>
          <p className="mt-3 text-[12px] text-ink-soft">Total Kasbon</p>
          <p className="font-display text-lg font-semibold text-ink">{formatRupiah(totalDebt)}</p>
        </Card>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] font-semibold text-leaf">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <Card>
        <CardHeader title="Daftar Warga" description={`${customers.length} warga aktif`} />
        <div className="p-4">
          <div className="relative mb-3">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              placeholder="Cari nama warga..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {list.length === 0 ? (
            <EmptyState title="Warga tidak ditemukan" />
          ) : (
            <div className="flex flex-col gap-1.5">
              {list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActive(c);
                    setSuccess(null);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-left transition hover:border-coral/40 hover:bg-coral-soft"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[13px] font-bold text-ink-soft">
                    {c.full_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{c.full_name}</p>
                    <p className="text-[11.5px] text-ink-faint">{c.phone ?? "—"}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone="leaf">{formatRupiah(Number(c.deposit_balance))}</Badge>
                    {Number(c.debt_balance) > 0 && (
                      <Badge tone="coral">Kasbon {formatRupiah(Number(c.debt_balance))}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {active && (
        <AdjustSheet
          customer={active}
          onClose={() => setActive(null)}
          onSuccess={(msg) => {
            setActive(null);
            setSuccess(msg);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AdjustSheet({
  customer,
  onClose,
  onSuccess,
}: {
  customer: AdminUser;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [type, setType] = useState<"topup_deposit" | "pay_debt">("topup_deposit");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount || 0);
  const debt = Number(customer.debt_balance);

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const result = await adjustBalance({
      customerId: customer.id,
      type,
      amount: value,
      paymentMethod,
      notes,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    onSuccess(
      type === "topup_deposit"
        ? `Top up ${formatRupiah(value)} untuk ${customer.full_name} tersimpan.`
        : `Pelunasan kasbon ${formatRupiah(value)} dari ${customer.full_name} tersimpan.`
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
          {customer.full_name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-ink">{customer.full_name}</h2>
          <p className="text-[12px] text-ink-soft">
            Deposit {formatRupiah(Number(customer.deposit_balance))} · Kasbon{" "}
            {formatRupiah(debt)}
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

      <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
        <div className="flex gap-2.5">
          <TypeButton
            active={type === "topup_deposit"}
            onClick={() => setType("topup_deposit")}
            icon={<Wallet size={17} />}
            label="Top Up Deposit"
          />
          <TypeButton
            active={type === "pay_debt"}
            onClick={() => setType("pay_debt")}
            icon={<HandCoins size={17} />}
            label="Bayar Kasbon"
            disabled={debt <= 0}
          />
        </div>

        <Field label="Nominal">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sizing="lg"
            className="text-center"
          />
        </Field>

        <Field label="Diterima Lewat">
          <div className="flex gap-2.5">
            <TypeButton
              active={paymentMethod === "cash"}
              onClick={() => setPaymentMethod("cash")}
              icon={<Banknote size={17} />}
              label="Tunai"
            />
            <TypeButton
              active={paymentMethod === "qris"}
              onClick={() => setPaymentMethod("qris")}
              icon={<QrCode size={17} />}
              label="QRIS"
            />
          </div>
        </Field>

        <div className="flex flex-wrap gap-2">
          {(type === "pay_debt" && debt > 0 ? [debt, ...PRESETS] : PRESETS).map((p, i) => (
            <button
              key={`${p}-${i}`}
              type="button"
              onClick={() => setAmount(String(p))}
              className="rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-ink-soft transition hover:border-coral/45 hover:bg-coral-soft hover:text-coral-dark"
            >
              {i === 0 && type === "pay_debt" ? "Lunasi " : ""}
              {formatRupiah(p)}
            </button>
          ))}
        </div>

        <Field label="Catatan (opsional)">
          <Input
            placeholder="mis. tunai di toko"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <Button size="lg" block disabled={pending || value <= 0} onClick={handleSubmit}>
          {pending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : type === "topup_deposit" ? (
            `Tambah Saldo ${value > 0 ? formatRupiah(value) : ""}`
          ) : (
            `Catat Pelunasan ${value > 0 ? formatRupiah(value) : ""}`
          )}
        </Button>
      </div>
    </Sheet>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 text-[13px] font-semibold transition",
        disabled && "cursor-not-allowed opacity-40",
        active ? "border-coral bg-coral-soft text-coral-dark" : "border-line text-ink-soft"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
