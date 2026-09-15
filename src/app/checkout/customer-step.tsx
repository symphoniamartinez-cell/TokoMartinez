"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Alert, Button, EmptyState, Field, Input, Sheet } from "@/components/ui";
import type { CustomerOption } from "@/lib/types";
import { addCustomer } from "./actions";

export default function CustomerStep({
  customers,
  onPick,
  onGuest,
  onCreated,
}: {
  customers: CustomerOption[];
  onPick: (customer: CustomerOption) => void;
  onGuest: () => void;
  onCreated: (customer: CustomerOption) => void;
}) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? customers.filter((c) => c.full_name.toLowerCase().includes(q)) : customers;
    return list.slice(0, 60);
  }, [customers, query]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-5">
      <div className="mb-5 text-center">
        <h2 className="font-display text-xl font-semibold text-ink">Belanja untuk siapa?</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          Pilih nama warga, atau tandai tamu untuk bayar langsung.
        </p>
      </div>

      <button
        type="button"
        onClick={onGuest}
        className="mb-3 flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-line-strong bg-surface px-4 py-3.5 text-left transition hover:border-coral/45 hover:bg-coral-soft"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-deep text-ink-soft">
          <UserRound size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">Tamu / Umum</span>
          <span className="mt-0.5 block text-[12px] text-ink-soft">
            Bayar langsung, QRIS atau tunai
          </span>
        </span>
        <ArrowRight size={17} className="text-ink-faint" />
      </button>

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

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-coral/40 bg-coral-soft px-4 py-2.5 text-[13px] font-semibold text-coral-dark transition hover:bg-coral hover:text-white"
      >
        <UserPlus size={16} />
        Daftarkan Warga Baru
      </button>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState title="Nama tidak ditemukan" description="Coba kata kunci lain." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPick(c)}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition hover:border-coral/40 hover:bg-coral-soft"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[13px] font-bold text-ink-soft">
                  {c.full_name.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{c.full_name}</span>
                <ChevronRight size={17} className="text-ink-faint" />
              </button>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddCustomerSheet
          onClose={() => setAddOpen(false)}
          onCreated={(c) => {
            setAddOpen(false);
            onCreated(c);
          }}
        />
      )}
    </main>
  );
}

function AddCustomerSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: CustomerOption) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [debtLimit, setDebtLimit] = useState("200000");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const result = await addCustomer({
      fullName,
      phone,
      pin,
      debtLimit: Number(debtLimit || 0),
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setDone(true);
    setTimeout(() => onCreated(result.customer), 700);
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-soft text-coral">
          <UserPlus size={19} />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-ink">Warga Baru</h2>
          <p className="text-[12px] text-ink-soft">Langsung bisa dipakai belanja</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5">
        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 size={40} className="text-leaf" />
            <p className="text-sm font-semibold text-ink">Akun {fullName} dibuat</p>
          </div>
        ) : (
          <>
            <Field label="Nama Lengkap">
              <Input
                autoFocus
                placeholder="mis. Bu Siti"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>
            <Field label="No. WhatsApp (opsional)">
              <Input
                inputMode="tel"
                placeholder="0812..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="PIN 4 Angka" hint="Dipakai untuk otorisasi potong saldo / kasbon.">
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder="mis. 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em]"
              />
            </Field>
            <Field label="Plafon Kasbon">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={debtLimit}
                onChange={(e) => setDebtLimit(e.target.value)}
              />
            </Field>

            {error && <Alert>{error}</Alert>}

            <Button size="lg" block disabled={pending || !fullName.trim()} onClick={handleSubmit}>
              {pending ? <Loader2 size={18} className="animate-spin" /> : "Simpan & Pilih"}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
