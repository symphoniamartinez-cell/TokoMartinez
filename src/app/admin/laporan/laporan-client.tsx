"use client";

import { useRouter } from "next/navigation";
import {
  Coins,
  Download,
  Layers,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button, Card, CardHeader, EmptyState, Field, Input, cx } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import type { ProfitLoss, ProfitLossByProduct } from "@/lib/types";

export default function LaporanClient({
  start,
  end,
  summary,
  byProduct,
}: {
  start: string;
  end: string;
  summary: ProfitLoss | null;
  byProduct: ProfitLossByProduct[];
}) {
  const router = useRouter();

  function updateRange(nextStart: string, nextEnd: string) {
    router.push(`/admin/laporan?mulai=${nextStart}&sampai=${nextEnd}`);
  }

  const netTone = (summary?.net_result ?? 0) >= 0 ? "leaf" : "danger";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Laba Rugi</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Ringkasan sederhana: omzet, HPP, dan kerugian selisih stok.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Dari">
            <Input
              type="date"
              value={start}
              onChange={(e) => updateRange(e.target.value, end)}
              className="w-40"
            />
          </Field>
          <Field label="Sampai">
            <Input
              type="date"
              value={end}
              onChange={(e) => updateRange(start, e.target.value)}
              className="w-40"
            />
          </Field>
          <a href={`/admin/export/transaksi?mulai=${start}&sampai=${end}`}>
            <Button variant="outline" size="md">
              <Download size={16} />
              <span className="hidden sm:inline">Transaksi</span>
            </Button>
          </a>
          <a href={`/admin/export/laba-rugi?mulai=${start}&sampai=${end}`}>
            <Button variant="outline" size="md">
              <Download size={16} />
              <span className="hidden sm:inline">Per Produk</span>
            </Button>
          </a>
        </div>
      </div>

      {!summary ? (
        <EmptyState title="Belum ada data" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              icon={<Receipt size={17} />}
              label="Omzet"
              value={formatRupiah(summary.revenue)}
              tone="coral"
              sub={`${summary.transaction_count} transaksi`}
            />
            <Stat
              icon={<Layers size={17} />}
              label="HPP (Modal Terjual)"
              value={formatRupiah(summary.cogs)}
              tone="gold"
            />
            <Stat
              icon={<TrendingUp size={17} />}
              label="Laba Kotor"
              value={formatRupiah(summary.gross_profit)}
              tone="leaf"
            />
            <Stat
              icon={<TrendingDown size={17} />}
              label="Kerugian Selisih Stok"
              value={formatRupiah(summary.shrinkage_loss)}
              tone="danger"
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span
                className={cx(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  netTone === "leaf" ? "bg-leaf-soft text-leaf" : "bg-danger-soft text-danger"
                )}
              >
                <Scale size={20} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-ink-soft">
                  Laba Bersih (Laba Kotor − Kerugian Selisih)
                </p>
                <p
                  className={cx(
                    "font-display text-2xl font-semibold",
                    netTone === "leaf" ? "text-leaf" : "text-danger"
                  )}
                >
                  {formatRupiah(summary.net_result)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
              Angka ini belum memasukkan biaya operasional (listrik, sewa, gaji, dll) — sistem
              belum mencatatnya. Ini murni laba dari barang dagangan.
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Per Produk"
              description="Diurutkan dari omzet terbesar"
              icon={<Coins size={17} />}
            />
            {byProduct.length === 0 ? (
              <EmptyState title="Belum ada penjualan di periode ini" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream text-left text-[11.5px] uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-4 py-2.5">Produk</th>
                      <th className="px-3 py-2.5 text-center">Terjual</th>
                      <th className="px-3 py-2.5 text-right">Omzet</th>
                      <th className="px-3 py-2.5 text-right">HPP</th>
                      <th className="px-4 py-2.5 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProduct.map((p) => (
                      <tr key={p.product_id} className="border-t border-line">
                        <td className="px-4 py-2.5 font-medium text-ink">{p.product_name}</td>
                        <td className="px-3 py-2.5 text-center text-ink-soft">{p.qty_sold}</td>
                        <td className="px-3 py-2.5 text-right text-ink-soft">
                          {formatRupiah(p.revenue)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-ink-soft">
                          {formatRupiah(p.cogs)}
                        </td>
                        <td
                          className={cx(
                            "px-4 py-2.5 text-right font-semibold",
                            p.margin >= 0 ? "text-leaf" : "text-danger"
                          )}
                        >
                          {formatRupiah(p.margin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "coral" | "gold" | "leaf" | "danger";
}) {
  const tones = {
    coral: "bg-coral-soft text-coral-dark",
    gold: "bg-gold-soft text-gold-dark",
    leaf: "bg-leaf-soft text-leaf",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <Card className="p-4">
      <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
        {icon}
      </span>
      <p className="mt-3 text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-faint">{sub}</p>}
    </Card>
  );
}
