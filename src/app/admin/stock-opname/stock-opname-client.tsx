"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCheck, Loader2, Moon, Sun } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  cx,
} from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import type { AdminProduct } from "@/lib/types";
import { submitStockAudit } from "./actions";

type Session = "morning" | "night";

export default function StockOpnameClient({
  products,
  defaultSession,
}: {
  products: AdminProduct[];
  defaultSession: Session;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session>(defaultSession);
  const [physical, setPhysical] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const filled = useMemo(
    () =>
      products
        .filter((p) => physical[p.id] !== undefined && physical[p.id] !== "")
        .map((p) => ({
          product: p,
          value: Number(physical[p.id]),
          diff: Number(physical[p.id]) - p.showcase_stock,
        })),
    [products, physical]
  );

  const estimatedLoss = filled.reduce(
    (sum, f) => (f.diff < 0 ? sum + Math.abs(f.diff) * f.product.cost_price : sum),
    0
  );
  const shortageCount = filled.filter((f) => f.diff < 0).length;
  const surplusCount = filled.filter((f) => f.diff > 0).length;

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const result = await submitStockAudit({
      session,
      audits: filled.map((f) => ({ product_id: f.product.id, physical_stock: f.value })),
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan audit.");
      return;
    }

    setDone(result.loss ?? 0);
    setPhysical({});
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Stock Opname</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Hitung fisik isi kulkas, lalu sistem mencatat selisih dan menyesuaikan stok.
        </p>
      </div>

      <div className="flex rounded-2xl border border-line bg-surface p-1.5">
        <SessionTab active={session === "morning"} onClick={() => setSession("morning")}>
          <Sun size={16} />
          Sesi Pagi
        </SessionTab>
        <SessionTab active={session === "night"} onClick={() => setSession("night")}>
          <Moon size={16} />
          Sesi Malam
        </SessionTab>
      </div>

      {done !== null && (
        <div className="flex items-start gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] text-leaf">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>
            <b>Audit tersimpan.</b> Stok kulkas sudah disesuaikan.{" "}
            {done > 0 ? `Tercatat kerugian ${formatRupiah(done)}.` : "Tidak ada kerugian."}
          </span>
        </div>
      )}

      <Card>
        <CardHeader
          title="Hitung Stok Fisik"
          description="Kosongkan bila produk tidak dihitung pada sesi ini."
          icon={<ClipboardCheck size={17} />}
        />

        <ul className="divide-y divide-line">
          {products.map((p) => {
            const raw = physical[p.id] ?? "";
            const diff = raw === "" ? null : Number(raw) - p.showcase_stock;
            const meta = categoryOf(p.category);

            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span
                  className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.chip)}
                >
                  <meta.icon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{p.name}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    Sistem: {p.showcase_stock} {p.retail_unit}
                  </p>
                </div>

                <div className="w-[72px] shrink-0">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="—"
                    value={raw}
                    onChange={(e) =>
                      setPhysical((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="px-2 text-center font-semibold"
                  />
                </div>

                <div className="w-14 shrink-0 text-right">
                  {diff === null ? (
                    <span className="text-[12px] text-ink-faint">—</span>
                  ) : diff === 0 ? (
                    <Badge tone="leaf">Aman</Badge>
                  ) : diff < 0 ? (
                    <Badge tone="danger">{diff}</Badge>
                  ) : (
                    <Badge tone="gold">+{diff}</Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {filled.length > 0 && (
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Summary label="Dihitung" value={String(filled.length)} />
            <Summary label="Kurang" value={String(shortageCount)} tone="danger" />
            <Summary label="Lebih" value={String(surplusCount)} tone="gold" />
          </div>
          {estimatedLoss > 0 && (
            <p className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">
              Estimasi kerugian: <b>{formatRupiah(estimatedLoss)}</b>
            </p>
          )}
        </Card>
      )}

      {error && <Alert>{error}</Alert>}

      <Button
        size="lg"
        variant="ink"
        block
        disabled={pending || filled.length === 0}
        onClick={handleSubmit}
      >
        {pending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          `Submit & Sesuaikan Stok (${filled.length})`
        )}
      </Button>
    </div>
  );
}

function SessionTab({
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
        "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
        active ? "bg-coral text-white shadow-sm shadow-coral/25" : "text-ink-soft hover:bg-cream"
      )}
    >
      {children}
    </button>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "gold";
}) {
  return (
    <div>
      <p
        className={cx(
          "font-display text-xl font-semibold",
          tone === "danger" ? "text-danger" : tone === "gold" ? "text-gold-dark" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-ink-soft">{label}</p>
    </div>
  );
}
