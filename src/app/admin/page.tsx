import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  ClipboardCheck,
  Coins,
  PackageSearch,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getToken, requireStaff } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, cx } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import type { AdminProduct } from "@/lib/types";

export const revalidate = 0;

const METHOD_LABEL: Record<string, string> = {
  qris: "QRIS",
  cash: "Tunai",
  deposit: "Saldo",
  debt: "Kasbon",
};

export default async function AdminDashboard() {
  const session = await requireStaff();
  const token = await getToken();
  const supabase = await createClient();

  const [{ data: statsRows }, { data: recent }, { data: products }] = await Promise.all([
    supabase.rpc("admin_dashboard", { p_token: token }),
    supabase.rpc("admin_recent_transactions", { p_token: token, p_limit: 6 }),
    supabase.rpc("admin_list_products", { p_token: token }),
  ]);

  const stats = statsRows?.[0];
  const lowStock = ((products ?? []) as AdminProduct[])
    .filter((p) => p.is_active && p.showcase_stock < p.min_showcase_threshold)
    .slice(0, 6);

  const firstName = session.full_name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Halo, {firstName}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ringkasan operasional Toko Martinez hari ini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<Receipt size={17} />}
          label="Transaksi Hari Ini"
          value={String(stats?.tx_count ?? 0)}
          tone="coral"
        />
        <Stat
          icon={<TrendingUp size={17} />}
          label="Omzet Hari Ini"
          value={formatRupiah(Number(stats?.tx_total ?? 0))}
          tone="leaf"
        />
        <Stat
          icon={<Coins size={17} />}
          label="Laba Kotor"
          value={formatRupiah(Number(stats?.tx_profit ?? 0))}
          tone="gold"
        />
        <Stat
          icon={<TrendingDown size={17} />}
          label="Selisih 7 Hari"
          value={formatRupiah(Number(stats?.loss_7d ?? 0))}
          tone={Number(stats?.loss_7d ?? 0) > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href="/admin/restock"
          icon={<ArrowLeftRight size={19} />}
          title="Stok Masuk"
          desc="Terima barang & isi kulkas"
        />
        <QuickAction
          href="/admin/stock-opname"
          icon={<ClipboardCheck size={19} />}
          title="Stock Opname"
          desc="Audit pagi / malam"
        />
        <QuickAction
          href="/admin/saldo"
          icon={<Wallet size={19} />}
          title="Saldo & Kasbon"
          desc="Top up & pelunasan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Perlu Restock"
            description="Stok kulkas di bawah batas minimum"
            icon={<AlertTriangle size={17} />}
          />
          {lowStock.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={30} />}
              title="Semua stok aman"
              description="Tidak ada produk di bawah batas minimum."
            />
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((p) => {
                const meta = categoryOf(p.category);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className={cx(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        meta.chip
                      )}
                    >
                      <meta.icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{p.name}</p>
                      <p className="text-[12px] text-ink-faint">
                        Gudang {p.warehouse_stock} {p.bulk_unit}
                      </p>
                    </div>
                    <Badge tone={p.showcase_stock === 0 ? "danger" : "gold"}>
                      {p.showcase_stock} {p.retail_unit}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Transaksi Terakhir"
            description="Enam transaksi paling baru"
            icon={<Receipt size={17} />}
          />
          {!recent || recent.length === 0 ? (
            <EmptyState
              icon={<Receipt size={30} />}
              title="Belum ada transaksi"
              description="Transaksi warga akan muncul di sini."
            />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((t: Record<string, unknown>) => (
                <li key={String(t.id)} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">
                      {String(t.customer_name)}
                    </p>
                    <p className="font-mono text-[11px] text-ink-faint">
                      {String(t.invoice_number)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {formatRupiah(Number(t.total_amount))}
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {METHOD_LABEL[String(t.payment_method)] ?? String(t.payment_method)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Nilai Stok Kulkas" value={formatRupiah(Number(stats?.showcase_value ?? 0))} />
        <MiniStat label="Nilai Stok Gudang" value={formatRupiah(Number(stats?.warehouse_value ?? 0))} />
        <MiniStat label="Total Deposit Warga" value={formatRupiah(Number(stats?.deposit_total ?? 0))} />
        <MiniStat label="Total Kasbon Warga" value={formatRupiah(Number(stats?.debt_total ?? 0))} />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "coral" | "leaf" | "gold" | "danger" | "neutral";
}) {
  const tones = {
    coral: "bg-coral-soft text-coral-dark",
    leaf: "bg-leaf-soft text-leaf",
    gold: "bg-gold-soft text-gold-dark",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-cream-deep text-ink-soft",
  };

  return (
    <Card className="p-4">
      <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
        {icon}
      </span>
      <p className="mt-3 text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink">{value}</p>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[11.5px] text-ink-soft">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-ink">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-coral/45 hover:bg-coral-soft"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-soft text-coral transition group-hover:bg-coral group-hover:text-white">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12px] text-ink-soft">{desc}</span>
      </span>
    </Link>
  );
}
