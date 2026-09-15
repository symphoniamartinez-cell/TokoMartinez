"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Landmark,
  Loader2,
  QrCode,
  Scale,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Input, cx } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { CashReconciliation, StockMovementRow } from "@/lib/types";
import { submitCashCount } from "./actions";

export default function RekonsiliasiClient({
  date,
  cash,
  movement,
}: {
  date: string;
  cash: CashReconciliation | null;
  movement: StockMovementRow[];
}) {
  const router = useRouter();
  const [physicalCash, setPhysicalCash] = useState(
    cash?.physical_cash != null ? String(cash.physical_cash) : ""
  );
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localDiff, setLocalDiff] = useState<number | null>(cash?.recon_difference ?? null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    const result = await submitCashCount({
      date,
      physicalCash: Number(physicalCash || 0),
      notes,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    setLocalDiff(result.difference ?? 0);
    setSaved(true);
    router.refresh();
  }

  const productsWithGap = movement.filter((m) => (m.selisih ?? 0) !== 0);
  const totalLossValue = movement.reduce(
    (sum, m) => (m.nilai_selisih && m.nilai_selisih > 0 ? sum + m.nilai_selisih : sum),
    0
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Rekonsiliasi Harian</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Cocokkan uang masuk & barang keluar fisik dengan yang tercatat sistem.
          </p>
        </div>
        <Field label="Tanggal" className="w-40">
          <Input
            type="date"
            value={date}
            onChange={(e) => router.push(`/admin/rekonsiliasi?tanggal=${e.target.value}`)}
          />
        </Field>
      </div>

      {/* ---------------- Kas ---------------- */}
      <Card>
        <CardHeader
          title="Uang Masuk Hari Ini"
          description="Dari transaksi tunai/QRIS dan top up/pelunasan tunai/QRIS."
          icon={<Landmark size={17} />}
        />
        {!cash ? (
          <EmptyState title="Belum ada data" />
        ) : (
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <CashCol
                icon={<Banknote size={16} />}
                label="Tunai"
                rows={[
                  ["Penjualan", cash.cash_sales],
                  ["Top Up Deposit", cash.cash_topup],
                  ["Pelunasan Kasbon", cash.cash_debt_payment],
                ]}
                total={cash.total_cash_expected}
              />
              <CashCol
                icon={<QrCode size={16} />}
                label="QRIS"
                rows={[
                  ["Penjualan", cash.qris_sales],
                  ["Top Up Deposit", cash.qris_topup],
                  ["Pelunasan Kasbon", cash.qris_debt_payment],
                ]}
                total={cash.total_qris_expected}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3">
              <span className="text-[13px] font-semibold text-ink-soft">Total Uang Masuk</span>
              <span className="font-display text-lg font-semibold text-ink">
                {formatRupiah(cash.total_expected)}
              </span>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <p className="mb-3 text-[13px] font-semibold text-ink">
                Hitung Kas Tunai Fisik di Laci
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Tunai Dihitung" className="flex-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={`Diharapkan ${formatRupiah(cash.total_cash_expected)}`}
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(e.target.value)}
                  />
                </Field>
                <Field label="Catatan (opsional)" className="flex-1">
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
                <Button disabled={pending || !physicalCash} onClick={handleSubmit} className="sm:mb-0">
                  {pending ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
                </Button>
              </div>

              {error && (
                <div className="mt-3">
                  <Alert>{error}</Alert>
                </div>
              )}

              {saved && localDiff !== null && (
                <div
                  className={cx(
                    "mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold",
                    localDiff === 0
                      ? "bg-leaf-soft text-leaf"
                      : "bg-danger-soft text-danger"
                  )}
                >
                  {localDiff === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {localDiff === 0
                    ? "Kas tunai pas, tidak ada selisih."
                    : localDiff > 0
                      ? `Kas lebih ${formatRupiah(localDiff)} dari perkiraan.`
                      : `Kas kurang ${formatRupiah(Math.abs(localDiff))} dari perkiraan.`}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ---------------- Stok ---------------- */}
      <Card>
        <CardHeader
          title="Barang Keluar vs Tercatat Terjual"
          description="Stok Pagi + Masuk − Stok Malam dibandingkan dengan qty di transaksi hari ini."
          icon={<Scale size={17} />}
        />
        {movement.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={30} />}
            title="Belum lengkap untuk tanggal ini"
            description="Perlu Stock Opname Pagi dan Malam pada tanggal yang sama supaya bisa dianalisis."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-3 py-2.5 text-center">Pagi</th>
                    <th className="px-3 py-2.5 text-center">Masuk</th>
                    <th className="px-3 py-2.5 text-center">Malam</th>
                    <th className="px-3 py-2.5 text-center">Keluar Fisik</th>
                    <th className="px-3 py-2.5 text-center">Tercatat</th>
                    <th className="px-4 py-2.5 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {movement.map((m) => (
                    <tr key={m.product_id} className="border-t border-line">
                      <td className="px-4 py-2.5 font-medium text-ink">{m.product_name}</td>
                      <td className="px-3 py-2.5 text-center text-ink-soft">{m.stok_pagi ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center text-ink-soft">{m.masuk}</td>
                      <td className="px-3 py-2.5 text-center text-ink-soft">{m.stok_malam ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-ink">
                        {m.keluar_fisik ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-ink-soft">{m.tercatat_terjual}</td>
                      <td className="px-4 py-2.5 text-right">
                        {m.selisih === 0 ? (
                          <Badge tone="leaf">Pas</Badge>
                        ) : (
                          <Badge tone={((m.selisih ?? 0) > 0) ? "danger" : "gold"}>
                            {(m.selisih ?? 0) > 0 ? "+" : ""}
                            {m.selisih} · {formatRupiah(m.nilai_selisih ?? 0)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line p-4">
              {productsWithGap.length === 0 ? (
                <p className="flex items-center gap-2 text-[13px] font-medium text-leaf">
                  <CheckCircle2 size={16} />
                  Semua produk pas antara barang keluar dan yang tercatat terjual.
                </p>
              ) : (
                <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
                  <AlertTriangle size={16} />
                  {productsWithGap.length} produk ada selisih. Estimasi potensi kerugian{" "}
                  {formatRupiah(totalLossValue)}.
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function CashCol({
  icon,
  label,
  rows,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  rows: [string, number][];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-line p-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
        {icon}
        {label}
      </p>
      {rows.map(([label2, value]) => (
        <div key={label2} className="flex justify-between py-0.5 text-[13px]">
          <span className="text-ink-soft">{label2}</span>
          <span className="text-ink">{formatRupiah(value)}</span>
        </div>
      ))}
      <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-[13px] font-semibold">
        <span className="text-ink">Total</span>
        <span className="text-ink">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}
