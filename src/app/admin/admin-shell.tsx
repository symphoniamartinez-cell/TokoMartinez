"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Scale,
  Store,
  TrendingUp,
  UserCog,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MartinezMark } from "@/components/brand";
import { cx } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/categories";
import type { SessionUser } from "@/lib/types";
import { logoutAction } from "./actions";

type NavItem = { href: string; label: string; icon: LucideIcon; roles?: string[] };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/restock", label: "Stok Masuk", icon: ArrowLeftRight },
  { href: "/admin/stock-opname", label: "Stock Opname", icon: ClipboardCheck },
  { href: "/admin/rekonsiliasi", label: "Rekonsiliasi", icon: Scale },
  { href: "/admin/saldo", label: "Saldo & Kasbon", icon: Wallet },
  { href: "/admin/laporan", label: "Laba Rugi", icon: TrendingUp, roles: ["admin", "superadmin"] },
  { href: "/admin/products", label: "Produk", icon: Package, roles: ["admin", "superadmin"] },
  { href: "/admin/users", label: "Pengguna", icon: UserCog, roles: ["superadmin"] },
  { href: "/admin/aktivitas", label: "Aktivitas", icon: History, roles: ["superadmin"] },
];

export default function AdminShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => !i.roles || i.roles.includes(session.role));

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-5 py-5">
          <div className="flex items-center gap-2.5">
            <MartinezMark className="h-9 w-9" />
            <div className="leading-none">
              <p className="font-display text-sm font-semibold tracking-[0.13em] text-ink">
                MARTINEZ
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
                Portal Petugas
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(item.href)
                  ? "bg-coral-soft text-coral-dark"
                  : "text-ink-soft hover:bg-cream hover:text-ink"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          <Link
            href="/checkout"
            className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-coral/50 hover:text-coral"
          >
            <Store size={18} />
            Layar Kiosk
          </Link>
        </nav>

        <UserCard session={session} />
      </aside>

      {/* Header (mobile) */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <MartinezMark className="h-8 w-8" />
            <div className="leading-none">
              <p className="font-display text-[13px] font-semibold tracking-[0.13em] text-ink">
                MARTINEZ
              </p>
              <p className="mt-1 text-[10px] font-medium text-ink-faint">
                {session.full_name} · {ROLE_LABELS[session.role]}
              </p>
            </div>
          </div>
          <LogoutButton compact />
        </div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition",
                isActive(item.href)
                  ? "bg-coral text-white"
                  : "bg-cream-deep text-ink-soft"
              )}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function UserCard({ session }: { session: SessionUser }) {
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-xl bg-cream px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-[13px] font-bold text-white">
          {session.full_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold text-ink">{session.full_name}</p>
          <p className="text-[11px] text-ink-soft">{ROLE_LABELS[session.role]}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}

function LogoutButton({ compact }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      title="Keluar"
      aria-label="Keluar"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void logoutAction();
      }}
      className={cx(
        "flex items-center justify-center rounded-lg text-ink-faint transition hover:bg-coral-soft hover:text-coral disabled:opacity-50",
        compact ? "h-10 w-10" : "h-8 w-8"
      )}
    >
      <LogOut size={compact ? 19 : 16} />
    </button>
  );
}
