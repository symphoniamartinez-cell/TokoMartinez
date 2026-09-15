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

Semua route wajib login petugas. Buka [http://localhost:3000](http://localhost:3000) — otomatis
diarahkan ke `/login`, lalu ke `/admin` setelah masuk.

> Build memakai webpack (`--webpack`), bukan Turbopack bawaan Next 16, karena Serwist belum
> mendukung Turbopack sepenuhnya. Flag sudah dipasang di `package.json`.

Warga **tidak login** — mereka tidak pernah membuka aplikasi ini. Semua transaksi diinput
petugas atas nama warga di kiosk; PIN 4 angka warga cuma dipakai sebagai otorisasi saat potong
saldo / kasbon (bisa diketik warga sendiri di layar, atau diketikkan petugas).

## Peran & Hak Akses

| Peran | Bisa apa |
| --- | --- |
| **Warga** | Tidak login. Cuma pemilik saldo/kasbon & PIN otorisasi — didaftarkan langsung dari kiosk oleh petugas |
| **Petugas** | Kiosk (input transaksi warga), stok masuk, stock opname, top up saldo & pelunasan kasbon, daftarkan warga baru |
| **Admin** | Semua akses petugas + kelola master produk |
| **Super Admin** | Semua akses admin + kelola pengguna, peran, dan kredensial |

### Akun awal

Kata sandi di bawah ini **wajib diganti** lewat menu *Pengguna* setelah login pertama.

| Username | Peran | Kata sandi awal |
| --- | --- | --- |
| `superadmin` | Super Admin | `MartinezSuper2026` |
| `martinez` | Admin | `MartinezAdmin2026` |

Akun warga didaftarkan lewat tombol **"Daftarkan Warga Baru"** langsung di kiosk (`/checkout`),
atau lewat menu *Pengguna* (super admin).

## Struktur Modul

| Route | Deskripsi |
| --- | --- |
| `/checkout` | Kiosk petugas: pilih/daftarkan warga (atau tandai Tamu/Umum) → pilih barang → bayar (Saldo/Kasbon untuk warga, QRIS/Tunai untuk tamu) |
| `/login` | Login petugas — juga jadi tujuan redirect `/` bila belum login |
| `/admin` | Dashboard: omzet, laba kotor, selisih stok, nilai persediaan |
| `/admin/restock` | **Nota Pembelian** (multi-item, diskon per-item & per-nota, HPP rata-rata tertimbang otomatis) & mutasi gudang → kulkas |
| `/admin/stock-opname` | Audit fisik pagi/malam + perhitungan kerugian |
| `/admin/rekonsiliasi` | Rekonsiliasi kas harian (tunai/QRIS vs fisik) + analisis barang keluar fisik vs tercatat terjual |
| `/admin/saldo` | Top up deposit & pelunasan kasbon warga (tunai/QRIS) |
| `/admin/laporan` | Laporan laba rugi sederhana: omzet, HPP, laba kotor, kerugian selisih stok, per produk *(admin)* |
| `/admin/products` | Master produk, satuan, rasio konversi, harga, hapus produk *(admin)*; **Zona Berbahaya** — reset semua stok ke 0 *(super admin)* |
| `/admin/users` | Kelola akun, peran, PIN, kata sandi, hapus akun *(super admin)* |

Hapus produk/akun **ditolak otomatis** kalau sudah punya riwayat transaksi/mutasi (sarankan
nonaktifkan saja) — supaya data historis tidak pernah rusak lewat klik yang salah. Reset stok di
Zona Berbahaya perlu mengetik ulang frasa konfirmasi, bukan cuma klik.

## Catatan Keamanan

- Semua penulisan data lewat fungsi Postgres `SECURITY DEFINER` yang memverifikasi sendiri
  token sesi / PIN. Tabel sensitif dikunci RLS tanpa policy, jadi anon key tidak bisa membacanya
  langsung.
- Sesi petugas disimpan di tabel `sessions`, dikirim lewat cookie `httpOnly`, dan **tidak pernah
  kedaluwarsa** (`expires_at = 'infinity'` di database; cookie di-set 400 hari — batas maksimum
  yang masih dihormati browser modern).
- Login dan PIN dikunci sementara 15 menit setelah 5 percobaan gagal.
- Pembayaran pakai saldo/kasbon butuh token otorisasi sekali pakai (berlaku 3 menit) yang hanya
  terbit setelah PIN benar.

## Catatan Akuntansi

- **HPP pakai metode rata-rata tertimbang (moving average)**, bukan FIFO/LIFO. Tiap nota
  pembelian masuk, `cost_price` produk dihitung ulang: `(nilai stok lama + nilai pembelian baru)
  / (unit lama + unit baru)`, mencakup stok di gudang maupun kulkas.
- **Laba Rugi** (`/admin/laporan`) murni dari barang dagangan (Omzet − HPP − Kerugian Selisih
  Stok). Belum memasukkan biaya operasional (listrik, sewa, gaji) karena sistem tidak
  mencatatnya — disebut eksplisit di halaman itu supaya tidak disalahartikan sebagai laba
  bersih sesungguhnya.
- **Rekonsiliasi Kas** (`/admin/rekonsiliasi`) membandingkan uang yang *seharusnya* masuk
  (penjualan tunai/QRIS + top up + pelunasan kasbon, dipecah per metode bayar) dengan hasil
  hitung fisik laci kas.
- **Analisis Barang Keluar** di halaman yang sama membandingkan `Stok Pagi + Masuk − Stok Malam`
  (yang secara fisik hilang dari kulkas) dengan jumlah yang tercatat terjual di transaksi hari
  itu — perlu Stock Opname Pagi **dan** Malam di tanggal yang sama supaya muncul.

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
