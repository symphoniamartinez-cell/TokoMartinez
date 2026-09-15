"use client";

import { useState } from "react";
import {
  Archive,
  Clock,
  Database,
  Download,
} from "lucide-react";
import { Badge, Card, CardHeader, EmptyState, cx } from "@/components/ui";
import type { ActivityLogRow, BackupRow } from "@/lib/types";

const ACTION_LABEL: Record<string, string> = {
  create_product: "Tambah produk",
  update_product: "Ubah produk",
  delete_product: "Hapus produk",
  create_user: "Buat akun",
  update_user: "Ubah akun",
  delete_user: "Hapus akun",
  change_role: "Ubah peran",
  reset_password: "Reset kata sandi",
  reset_stock: "Reset stok",
  full_data_reset: "Reset seluruh data",
};

const ACTION_TONE: Record<string, "danger" | "gold" | "leaf" | "neutral"> = {
  delete_product: "danger",
  delete_user: "danger",
  full_data_reset: "danger",
  reset_stock: "danger",
  change_role: "gold",
  reset_password: "gold",
};

export default function AktivitasClient({
  log,
  backups,
}: {
  log: ActivityLogRow[];
  backups: BackupRow[];
}) {
  const [tab, setTab] = useState<"log" | "backup">("log");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Aktivitas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Jejak perubahan oleh admin/superadmin & cadangan data sebelum reset total.
        </p>
      </div>

      <div className="flex rounded-2xl border border-line bg-surface p-1.5">
        <TabButton active={tab === "log"} onClick={() => setTab("log")}>
          <Clock size={15} /> Log Aktivitas
        </TabButton>
        <TabButton active={tab === "backup"} onClick={() => setTab("backup")}>
          <Archive size={15} /> Cadangan Data
        </TabButton>
      </div>

      {tab === "log" ? (
        <Card>
          <CardHeader
            title="Log Aktivitas"
            description={`${log.length} kejadian terakhir`}
            icon={<Clock size={17} />}
          />
          {log.length === 0 ? (
            <EmptyState title="Belum ada aktivitas tercatat" />
          ) : (
            <ul className="divide-y divide-line">
              {log.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {entry.actor_name}
                      <span className="font-normal text-ink-soft">
                        {" "}
                        — {(ACTION_LABEL[entry.action] ?? entry.action).toLowerCase()}
                      </span>
                    </p>
                    {entry.target_label && (
                      <p className="truncate text-[12px] text-ink-faint">{entry.target_label}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={ACTION_TONE[entry.action] ?? "neutral"}>
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </Badge>
                    <span className="text-[11px] text-ink-faint">
                      {new Date(entry.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="Cadangan Data"
            description="Snapshot otomatis dibuat sesaat sebelum 'Reset Semua Data' dijalankan"
            icon={<Database size={17} />}
          />
          {backups.length === 0 ? (
            <EmptyState
              icon={<Archive size={30} />}
              title="Belum ada cadangan"
              description="Cadangan dibuat otomatis saat reset total pertama kali dijalankan."
            />
          ) : (
            <ul className="divide-y divide-line">
              {backups.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-ink">
                      Reset oleh {b.created_by_name}
                    </p>
                    <p className="text-[12px] text-ink-faint">
                      {new Date(b.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {b.row_counts.transactions ?? 0} transaksi, {b.row_counts.stock_audits ?? 0}{" "}
                      opname, {b.row_counts.purchase_invoices ?? 0} nota
                    </p>
                  </div>
                  <a
                    href={`/admin/export/backup/${b.id}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[12px] font-semibold text-ink-soft transition hover:border-coral/40 hover:bg-coral-soft hover:text-coral-dark"
                  >
                    <Download size={14} />
                    Unduh JSON
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function TabButton({
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
