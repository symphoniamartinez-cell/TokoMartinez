# Toko Martinez — Kasir Mandiri & Manajemen Stok

Aplikasi kasir mandiri (honesty kiosk) dan manajemen inventaris untuk Toko Martinez at Symphonia,
dibangun dari [PRD_Toko_Martinez.md](./PRD_Toko_Martinez.md).

## Stack

- Next.js 16 (App Router, Server Actions)
- Supabase (PostgreSQL + RLS) — project `toko-martinez-kiosk`
- Tailwind CSS v4 + lucide-react
- Serwist (PWA / service worker)

## Menjalankan

```bash
npm install
npm run dev
```

- Kiosk warga: [http://localhost:3000/checkout](http://localhost:3000/checkout) — terbuka tanpa login
- Portal petugas: [http://localhost:3000/admin](http://localhost:3000/admin) — wajib login

> Build memakai webpack (`--webpack`), bukan Turbopack bawaan Next 16, karena Serwist belum
> mendukung Turbopack sepenuhnya. Flag sudah dipasang di `package.json`.

## Peran & Hak Akses

| Peran | Bisa apa |
| --- | --- |
| **Warga** | Belanja di kiosk. Tidak login; otorisasi pakai PIN 4 angka saat potong saldo / kasbon |
| **Petugas** | Stok masuk, stock opname, top up saldo & pelunasan kasbon |
| **Admin** | Semua akses petugas + kelola master produk |
| **Super Admin** | Semua akses admin + kelola pengguna, peran, dan kredensial |

### Akun awal

Kata sandi di bawah ini **wajib diganti** lewat menu *Pengguna* setelah login pertama.

| Username | Peran | Kata sandi awal |
| --- | --- | --- |
| `superadmin` | Super Admin | `MartinezSuper2026` |
| `martinez` | Admin | `MartinezAdmin2026` |
| `joko` | Petugas | `TokoJoko2026` |

Warga contoh: Bu Siti (PIN `1111`), Pak Budi (PIN `2222`).

## Struktur Modul

| Route | Deskripsi |
| --- | --- |
| `/checkout` | Kiosk mandiri: katalog per kategori, keranjang, QRIS/Tunai, potong saldo, kasbon |
| `/login` | Login petugas |
| `/admin` | Dashboard: omzet, laba kotor, selisih stok, nilai persediaan |
| `/admin/restock` | Terima barang ke gudang & mutasi gudang → kulkas |
| `/admin/stock-opname` | Audit fisik pagi/malam + perhitungan kerugian |
| `/admin/saldo` | Top up deposit & pelunasan kasbon warga |
| `/admin/products` | Master produk, satuan, rasio konversi, harga *(admin)* |
| `/admin/users` | Kelola akun, peran, PIN, kata sandi *(super admin)* |

## Catatan Keamanan

- Semua penulisan data lewat fungsi Postgres `SECURITY DEFINER` yang memverifikasi sendiri
  token sesi / PIN. Tabel sensitif dikunci RLS tanpa policy, jadi anon key tidak bisa membacanya
  langsung.
- Sesi petugas disimpan di tabel `sessions` (berlaku 12 jam) dan dikirim lewat cookie `httpOnly`.
- Login dan PIN dikunci sementara 15 menit setelah 5 percobaan gagal.
- Pembayaran pakai saldo/kasbon butuh token otorisasi sekali pakai (berlaku 3 menit) yang hanya
  terbit setelah PIN benar.

## Variabel Lingkungan

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Lokal ada di `.env.local` (tidak di-commit). Di Vercel, isi lewat **Project Settings → Environment
Variables** agar build dari GitHub ikut membawanya.

## PWA & Android (TWA)

Manifest di `public/manifest.json`, ikon di `public/icons/`. Untuk membungkus jadi APK lewat
Bubblewrap, ikuti bagian 8.2 PRD dan isi `sha256_cert_fingerprints` di
`public/.well-known/assetlinks.json` (masih placeholder).
