"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
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
  Select,
  Sheet,
  cx,
} from "@/components/ui";
import { ROLE_LABELS } from "@/lib/categories";
import { formatRupiah } from "@/lib/format";
import type { AdminUser, Role } from "@/lib/types";
import { deleteUser, saveUser, unlockUser } from "./actions";

const ROLE_TONE: Record<string, "coral" | "gold" | "leaf" | "neutral"> = {
  superadmin: "coral",
  admin: "gold",
  staff: "leaf",
  customer: "neutral",
};

const ROLE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "staff-ish", label: "Petugas" },
  { key: "customer", label: "Warga" },
];

export default function UsersClient({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q);
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "customer" ? u.role === "customer" : u.role !== "customer");
      return matchQuery && matchRole;
    });
  }, [users, query, roleFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Pengguna</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Kelola akun petugas dan warga beserta hak aksesnya.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="shrink-0">
          <Plus size={17} />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-leaf-soft px-4 py-3 text-[13px] font-semibold text-leaf">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <Card>
        <CardHeader
          title="Daftar Akun"
          description={`${users.length} akun terdaftar`}
          icon={<ShieldCheck size={17} />}
        />

        <div className="p-4">
          <div className="mb-3 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
                placeholder="Cari nama atau username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRoleFilter(f.key === "staff-ish" ? "staff-ish" : f.key)}
                  className={cx(
                    "rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition",
                    roleFilter === f.key
                      ? "bg-coral text-white"
                      : "bg-cream-deep text-ink-soft hover:text-ink"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState title="Akun tidak ditemukan" />
          ) : (
            <div className="flex flex-col gap-1.5">
              {list.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setEditing(u);
                    setSuccess(null);
                  }}
                  className={cx(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                    u.is_active
                      ? "border-line hover:border-coral/40 hover:bg-coral-soft"
                      : "border-line bg-cream opacity-60"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[13px] font-bold text-ink-soft">
                    {u.full_name.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-ink">
                      {u.full_name}
                      {u.locked && <Lock size={12} className="text-danger" />}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-faint">
                      {u.username ? `@${u.username}` : (u.phone ?? "—")}
                      {!u.is_active && " · nonaktif"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    {u.role === "customer" && Number(u.debt_balance) > 0 && (
                      <span className="text-[11px] text-ink-faint">
                        Kasbon {formatRupiah(Number(u.debt_balance))}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {editing && (
        <UserSheet
          user={editing === "new" ? null : editing}
          isSelf={editing !== "new" && editing.id === currentUserId}
          onClose={() => setEditing(null)}
          onSuccess={(msg) => {
            setEditing(null);
            setSuccess(msg);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function UserSheet({
  user,
  isSelf,
  onClose,
  onSuccess,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "customer");
  const [debtLimit, setDebtLimit] = useState(String(user?.debt_limit ?? 200000));
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const needsLogin = role !== "customer";

  async function handleSubmit() {
    setError(null);
    setPending(true);

    const result = await saveUser({
      id: user?.id ?? null,
      fullName,
      phone,
      username: needsLogin ? username : "",
      role,
      debtLimit: Number(debtLimit || 0),
      isActive,
      password,
      pin,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    onSuccess(user ? `Perubahan untuk ${fullName} tersimpan.` : `Akun ${fullName} dibuat.`);
  }

  async function handleUnlock() {
    if (!user) return;
    setPending(true);
    const result = await unlockUser(user.id);
    setPending(false);
    if (!result.ok) {
      setError(result.message ?? "Gagal membuka kunci.");
      return;
    }
    onSuccess(`Kunci akun ${user.full_name} dibuka.`);
  }

  async function handleDelete() {
    if (!user) return;
    setError(null);
    setDeleting(true);

    const result = await deleteUser(user.id);

    setDeleting(false);

    if (!result.ok) {
      setError(result.message ?? "Gagal menghapus.");
      setConfirmDelete(false);
      return;
    }

    onSuccess(`Akun ${user.full_name} dihapus.`);
  }

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-soft text-coral">
          {user ? <KeyRound size={19} /> : <UserPlus size={19} />}
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-ink">
            {user ? "Ubah Akun" : "Akun Baru"}
          </h2>
          <p className="text-[12px] text-ink-soft">
            {user ? user.full_name : "Lengkapi data pengguna"}
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
        <Field label="Nama Lengkap">
          <Input
            autoFocus={!user}
            placeholder="mis. Bu Siti"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="No. WhatsApp">
            <Input
              inputMode="tel"
              placeholder="0812..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Peran">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isSelf}
            >
              <option value="customer">Warga</option>
              <option value="staff">Petugas</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </Select>
          </Field>
        </div>

        {needsLogin && (
          <Field label="Username" hint="Dipakai untuk login ke portal petugas.">
            <Input
              autoCapitalize="none"
              placeholder="mis. joko"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
        )}

        {role === "customer" && (
          <Field label="Plafon Kasbon" hint="Batas maksimum total kasbon warga ini.">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={debtLimit}
              onChange={(e) => setDebtLimit(e.target.value)}
            />
          </Field>
        )}

        <div className="rounded-2xl border border-line bg-cream p-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">
            Kredensial
          </p>
          <div className="flex flex-col gap-3">
            {needsLogin && (
              <Field
                label="Kata Sandi"
                hint={
                  user?.has_password
                    ? "Kosongkan bila tidak ingin mengubah."
                    : "Minimal 8 karakter."
                }
              >
                <Input
                  type="text"
                  autoComplete="new-password"
                  placeholder={user?.has_password ? "••••••••" : "Buat kata sandi"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
            <Field
              label="PIN 4 Angka"
              hint={
                user?.has_pin
                  ? "Kosongkan bila tidak ingin mengubah PIN."
                  : "Untuk otorisasi potong saldo / kasbon."
              }
            >
              <Input
                inputMode="numeric"
                maxLength={4}
                placeholder={user?.has_pin ? "••••" : "mis. 1234"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em]"
              />
            </Field>
          </div>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span>
            <span className="block text-[13.5px] font-semibold text-ink">Akun Aktif</span>
            <span className="text-[12px] text-ink-soft">
              Nonaktif berarti tidak bisa login &amp; transaksi.
            </span>
          </span>
          <input
            type="checkbox"
            checked={isActive}
            disabled={isSelf}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 accent-[#e2645b] disabled:opacity-40"
          />
        </label>

        {user?.locked && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3">
            <span className="text-[13px] font-medium text-danger">
              Akun terkunci karena percobaan gagal berulang.
            </span>
            <Button variant="outline" size="sm" onClick={handleUnlock} disabled={pending}>
              <LockOpen size={15} />
              Buka
            </Button>
          </div>
        )}

        {error && <Alert>{error}</Alert>}

        <Button size="lg" block disabled={pending || !fullName.trim()} onClick={handleSubmit}>
          {pending ? <Loader2 size={18} className="animate-spin" /> : "Simpan"}
        </Button>

        {user && !isSelf && (
          <div className="border-t border-line pt-4">
            {confirmDelete ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-center text-[13px] text-ink-soft">
                  Yakin hapus akun <b>{user.full_name}</b> permanen? Kalau akun ini sudah pernah
                  bertransaksi atau memproses mutasi/nota, sistem akan menolak dan sarankan
                  nonaktifkan saja.
                </p>
                <div className="flex gap-2.5">
                  <Button variant="outline" size="sm" block onClick={() => setConfirmDelete(false)}>
                    Batal
                  </Button>
                  <Button variant="danger" size="sm" block disabled={deleting} onClick={handleDelete}>
                    {deleting ? <Loader2 size={15} className="animate-spin" /> : "Ya, Hapus"}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold text-danger transition hover:bg-danger-soft"
              >
                <Trash2 size={15} />
                Hapus Akun
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
