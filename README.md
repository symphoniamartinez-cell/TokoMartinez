# Toko Martinez — Self-Service Kiosk & Inventory Management

Aplikasi kasir mandiri (honesty kiosk) dan manajemen inventaris untuk Toko Martinez, dibangun sesuai [PRD_Toko_Martinez.md](./PRD_Toko_Martinez.md).

## Stack

- Next.js 16 (App Router, Server Actions)
- Supabase (Postgres + RLS) — project `toko-martinez-kiosk`
- Tailwind CSS + lucide-react
- Serwist (PWA / service worker)

## Getting Started

```bash
npm install
npm run dev
```

Buka [http://localhost:3000/checkout](http://localhost:3000/checkout) untuk kiosk pelanggan, atau `/admin` untuk menu petugas.

> Catatan: PWA build memakai webpack (bukan Turbopack default Next 16) karena Serwist belum mendukung Turbopack sepenuhnya. `dev` dan `build` sudah diarahkan otomatis lewat flag `--webpack` di `package.json`.

## Struktur Modul

| Route | Deskripsi |
| --- | --- |
| `/checkout` | Kiosk mandiri: katalog produk, keranjang, pembayaran QRIS/Tunai/Potong Saldo/Ambil Dulu |
| `/admin` | Dashboard ringkas: omzet hari ini, alert stok menipis |
| `/admin/restock` | Mutasi stok Gudang → Kulkas Showcase |
| `/admin/stock-opname` | Audit stok fisik pagi/malam & perhitungan selisih (shrinkage) |

## Database

Skema, fungsi RPC (checkout atomik, verifikasi PIN, restock, stock opname), dan RLS policy sudah dijalankan di project Supabase **toko-martinez-kiosk** (region `ap-southeast-1`). Kredensial ada di `.env.local` (tidak di-commit).

Akun contoh (PIN untuk demo):

| Nama | Role | PIN |
| --- | --- | --- |
| Pak Joko | staff | 1234 |
| Bu Martinez | admin | 9999 |
| Bu Siti | customer (saldo deposit) | 1111 |
| Pak Budi | customer (kasbon) | 2222 |

## PWA & Android (TWA)

Manifest ada di `public/manifest.json`. Untuk build APK via Bubblewrap setelah deploy ke Vercel, ikuti bagian 8.2 di PRD — jangan lupa isi `sha256_cert_fingerprints` di `public/.well-known/assetlinks.json` (masih placeholder).
