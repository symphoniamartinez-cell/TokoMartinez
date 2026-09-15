# Product Requirement Document (PRD)
# Toko Martinez Self-Service Kiosk & Inventory Management System

**Version:** 1.0.0  
**Status:** Ready for Development  
**Target Platform:** Progressive Web App (PWA) + Android APK wrapper (via TWA)  
**Infrastructure Stack:** Next.js (App Router), Supabase (Free Tier), Vercel (Hobby Tier)

---

## 1. Executive Summary & Background

Toko Martinez adalah toko mandiri komunitas/warga yang berfokus pada penjualan minuman kemasan (produk Mayora Group seperti Le Minerale galon & botol, Teh Pucuk Harum, Kopiko 78, dsb.). Sistem operasional toko memiliki karakteristik unik:
1. **Model Penjualan Mandiri (Honesty/Self-Service Kiosk):** Pelanggan mengambil minuman sendiri dan mencatat transaksi di aplikasi toko atau HP pribadi.
2. **Fleksibilitas Pembayaran Warga:** Warga dapat membayar langsung (QRIS/tunai), memotong saldo deposit prabayar (top-up di awal), atau sistem "Ambil Dulu" (tagihan/kasbon berkala).
3. **Konversi Satuan & Lokasi Stok Bertingkat:** Barang dibeli dalam satuan bulk (Dus/Krat/Galon induk) dan disimpan di Gudang, kemudian dimutasi ke Kulkas Showcase dalam satuan eceran (Botol/Pcs) agar dingin.
4. **Pencegahan & Audit Penyusutan (Shrinkage):** Karena menganut sistem mandiri, risiko barang keluar tanpa tercatat (lupa bayar) dimitigasi melalui Stock Opname rutin 2x sehari (Pagi sebelum buka dan Malam saat tutup) untuk mencatat selisih fisik vs sistem.

Dokumen ini mendefinisikan arsitektur sistem, skema basis data PostgreSQL (Supabase), alur bisnis transaksi, serta roadmap pembungkusan ke format APK Android secara hemat biaya memanfaatkan tier gratis (Free Tier).

---

## 2. Arsitektur Teknologi & Infrastruktur

| Komponen | Teknologi | Keterangan & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router) | Mendukung React Server Components (RSC) untuk efisiensi fetch data & caching tinggi. |
| **PWA Engine** | `@ducanh2912/next-pwa` atau Serwist | Menangani service worker, cache offline-first untuk aset statis, dan web app manifest. |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Ringan, responsif, dan ramah sentuhan (touch-friendly kiosk mode). |
| **Database & Auth** | Supabase (PostgreSQL + RLS) | Free tier mencakup 500MB DB, 50.000 Monthly Active Users, dan Realtime subscriptions. |
| **Hosting & CDN** | Vercel (Hobby Tier) | Zero-config deployment, Edge Network cepat di regional Asia Tenggara (Singapore `sin1`). |
| **Android Packaging** | Google Bubblewrap CLI / PWA Builder | Membungkus PWA menjadi Android Package (.apk / .aab) menggunakan Trusted Web Activity (TWA). |

---

## 3. User Roles & Hak Akses

| Peran | Deskripsi | Hak Akses Utama |
| :--- | :--- | :--- |
| **Warga / Customer** | Pelanggan komunitas yang terdaftar atau tamu umum. | - Scan / pilih produk di showcase.<br>- Checkout dengan QRIS, Saldo Deposit, atau Ambil Dulu (Utang).<br>- Memeriksa sisa saldo deposit & riwayat bon pribadi. |
| **Petugas / Staff** | Petugas operasional harian toko. | - Melakukan mutasi stok (Gudang Dus -> Showcase Pcs).<br>- Melakukan Stock Opname pagi dan malam.<br>- Menerima top-up saldo deposit warga & pelunasan utang. |
| **Owner / Admin** | Pemilik toko Martinez. | - Akses laporan finansial, loss value (rugi selisih barang), margin laba.<br>- Manajemen master produk, harga beli/jual, dan rasio konversi. |

---

## 4. Alur Bisnis Inti (Core Business Flows)

### 4.1. Manajemen Inventaris Bertingkat & Konversi Satuan
Toko mengelola 2 entitas lokasi inventaris untuk setiap produk:
* **Gudang (Warehouse):** Satuan Penyimpanan Besar (Bulk Unit), misalnya: `Dus`, `Krat`, `Karton`.
* **Kulkas Showcase:** Satuan Eceran Siap Konsumsi (Retail Unit), misalnya: `Botol`, `Kaleng`, `Cup`, `Pcs`.

Setiap produk memiliki metadata `conversion_ratio` (misal: 1 Dus Le Minerale 600ml = 24 Botol).
* **Alur Restock Kulkas:**
  1. Petugas mengambil 2 dus dari Gudang.
  2. Petugas menginput di sistem: "Pindah 2 Dus Le Minerale ke Showcase".
  3. Sistem otomatis memotong stok Gudang sebanyak `2 Dus` dan menambah stok Showcase sebanyak `48 Botol`.
  4. Penjualan pelanggan hanya memotong stok Showcase.

### 4.2. Siklus Transaksi Checkout Mandiri
1. **Pemilihan Barang:** Pengguna memilih minuman dari grid katalog (atau scan barcode via kamera HP/tablet).
2. **Review Keranjang:** Menampilkan item, jumlah botol, dan total rupiah.
3. **Pilihan Pembayaran:**
   * **Opsi A - QRIS Statis / Tunai:** Menampilkan barcode QRIS toko. Pengguna scan dan menekan "Konfirmasi Bayar".
   * **Opsi B - Potong Saldo Deposit:** Pengguna memilih nama akun warga -> Memasukkan 4-digit PIN keamanan -> Saldo deposit berkurang otomatis.
   * **Opsi C - Ambil Dulu (Utang / Tab):** Pengguna memilih nama akun warga -> Masukkan PIN -> Nilai transaksi ditambahkan ke akumulasi utang warga.
4. Transaksi selesai, stok eceran di Showcase berkurang secara atomik (Postgres transaction).

### 4.3. Stock Opname & Shrinkage Tracking (2x Sehari)
Untuk mendeteksi barang hilang atau warga yang lupa bayar:
* **Jadwal:** Pagi Hari (sebelum transaksi ramai) & Malam Hari (penutupan operasional).
* **Alur Kerja:**
  1. Petugas membuka menu **Audit Stock Showcase**.
  2. Sistem menampilkan daftar produk dingin dan kolom input **Stok Fisik Aktual**.
  3. Sistem menghitung:
     $$\text{Selisih (Discrepancy)} = \text{Stok Fisik} - \text{Stok Sistem}$$
  4. Jika $\text{Selisih} < 0$, sistem menghitung potensi kerugian:
     $$\text{Loss Value} = |\text{Selisih}| \times \text{Harga Modal (atau Harga Jual)}$$
  5. Catatan selisih otomatis tersimpan di tabel log audit dan stok sistem showcase disesuaikan (*reconciled*) mengikuti stok fisik aktual.

---

## 5. Skema Basis Data (Supabase PostgreSQL DDL)

Berikut adalah skrip SQL lengkap yang siap dieksekusi di *SQL Editor* Supabase:

```sql
-- Aktifkan ekstensi UUID
create extension if not exists "uuid-ossp";

-- 1. TABEL PROFIL WARGA & PENGGUNA
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text unique,
  role text default 'customer' check (role in ('customer', 'staff', 'admin')),
  pin_hash text, -- 4 digit PIN ter-hash untuk otorisasi potong saldo / utang
  deposit_balance numeric(12, 2) default 0.00 check (deposit_balance >= 0),
  debt_balance numeric(12, 2) default 0.00 check (debt_balance >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MASTER PRODUK MINUMAN
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  brand text default 'Mayora',
  category text check (category in ('air_galon', 'air_mineral', 'minuman_manis', 'kopi_teh', 'lainnya')),
  image_url text,
  bulk_unit text not null default 'dus',       -- dus, karton, galon
  retail_unit text not null default 'botol',   -- botol, pcs, cup
  conversion_ratio integer not null default 24 check (conversion_ratio > 0), -- 1 dus = 24 botol
  cost_price numeric(12, 2) not null default 0,    -- harga modal per eceran
  retail_price numeric(12, 2) not null default 0,  -- harga jual per eceran
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. INVENTARIS LOKASI (GUDANG VS SHOWCASE)
create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  warehouse_stock integer not null default 0 check (warehouse_stock >= 0), -- stok gudang (satuan bulk / dus)
  showcase_stock integer not null default 0,                               -- stok kulkas (satuan eceran / botol)
  min_showcase_threshold integer default 5,                                -- alert restock jika kurang dari ini
  updated_at timestamptz default now()
);

-- 4. LOG MUTASI GUDANG KE SHOWCASE
create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  bulk_quantity integer not null check (bulk_quantity > 0), -- jumlah dus yang dipindah
  retail_quantity_added integer not null,                   -- bulk_quantity * conversion_ratio
  transferred_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- 5. TRANSAKSI PENJUALAN
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id), -- nullable jika anonymous QRIS/cash
  invoice_number text unique not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('qris', 'deposit', 'debt', 'cash')),
  payment_status text not null default 'completed' check (payment_status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null,
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

-- 6. STOCK OPNAME & AUDIT SHRINKAGE (PAGI & MALAM)
create table public.stock_audits (
  id uuid primary key default gen_random_uuid(),
  audit_session text not null check (audit_session in ('morning', 'night')),
  product_id uuid not null references public.products(id),
  system_stock integer not null,    -- stok tercatat di showcase sebelum opname
  physical_stock integer not null,  -- hasil hitung fisik di kulkas
  difference integer not null,      -- physical_stock - system_stock
  loss_value numeric(12, 2) default 0.00, -- kerugian jika selisih minus
  audited_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- 7. MUTASI SALDO DEPOSIT & PELUNASAN UTANG
create table public.balance_ledgers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('topup_deposit', 'use_deposit', 'incur_debt', 'pay_debt')),
  amount numeric(12, 2) not null check (amount > 0),
  reference_id uuid, -- relasi ke id transaksi atau bukti transfer
  notes text,
  created_at timestamptz default now()
);

-- FUNCTION & TRIGGER: OTOMATIS MUTASI STOK SHOWCASE SAAT RESTOCK DILAKUKAN
create or replace function handle_stock_transfer()
returns trigger as $$
declare
  v_ratio integer;
begin
  select conversion_ratio into v_ratio from public.products where id = new.product_id;
  new.retail_quantity_added := new.bulk_quantity * v_ratio;

  -- Potong gudang, tambah showcase
  update public.inventory
  set warehouse_stock = warehouse_stock - new.bulk_quantity,
      showcase_stock = showcase_stock + new.retail_quantity_added,
      updated_at = now()
  where product_id = new.product_id;

  return new;
end;
$$ language plpgsql;

create trigger tr_stock_transfer
before insert on public.stock_transfers
for each row execute function handle_stock_transfer();
```

---

## 6. Functional Specifications & Rancangan Antarmuka (UI/UX)

### 6.1. Layar Kiosk / Self-Service Checkout (`/checkout`)
* **Katalog Minuman Grid:** Kartu produk visual dilengkapi status suhu ("Dingin di Kulkas"), harga eceran, dan tombol tambah cepat (+/-).
* **Tray Keranjang Belanja:** Bagian bawah layar sticky bar menampilkan jumlah item dan total harga.
* **Modal Pembayaran:**
  * Tab QRIS: QR Code Toko Martinez + Instruksi transfer.
  * Tab Potong Saldo: Dropdown pencarian nama warga -> Numpad PIN 4 angka.
  * Tab Ambil Dulu: Peringatan batas plafon kasbon -> Konfirmasi PIN warga.

### 6.2. Layar Mutasi Gudang ke Kulkas (`/admin/restock`)
* Input cepat untuk petugas:
  * Pilih Minuman (misal: "Teh Pucuk Harum 350ml").
  * Menampilkan info: 1 Dus = 24 Botol. Sisa di gudang saat ini: 8 Dus.
  * Masukkan jumlah dus yang dipindah (misal: 2 Dus).
  * Tombol konfirmasi "Pindahkan ke Kulkas" -> Stok gudang jadi 6 Dus, showcase bertambah 48 Botol.

### 6.3. Layar Stock Opname Pagi & Malam (`/admin/stock-opname`)
* Pemilihan shift: Radio button **Pagi** atau **Malam**.
* Tabel checklist produk showcase:
  * Kolom: Nama Produk | Stok Sistem | Input Fisik Aktual | Status.
  * Feedback visual real-time:
    * Warna Hijau: Fisik = Sistem (Aman).
    * Warna Merah: Fisik < Sistem (Ada selisih hilang/belum bayar).
    * Warna Kuning: Fisik > Sistem (Kemungkinan salah hitung atau belum input restock).
* Tombol **"Submit & Sesuaikan Stok"**: Mengunci catatan audit dan menyinkronkan stok showcase ke angka fisik terbaru.

---

## 7. Strategi Optimasi Free Tier (Supabase & Vercel)

1. **Next.js Server Actions & Route Handlers:** Semua query database dijalankan di sisi server (Node runtime/Edge) agar tidak mengekspos koneksi langsung database pool ke client.
2. **ISR & Data Cache:** Master produk jarang berubah, gunakan `fetch(..., { next: { revalidate: 3600 } })` sehingga panggilan API produk tidak membebani kuota API request Supabase.
3. **Optimistic UI Updates:** Saat pelanggan menekan tombol checkout, UI langsung merespons secara optimis untuk pengalaman pengguna instan, lalu menyinkronkan di background.
4. **Row Level Security (RLS):** Pelanggan hanya memiliki izin baca ke master produk dan izin tulis terbatas ke transaksi item mereka sendiri.

---

## 8. Panduan Build Progressive Web App (PWA) & Android APK

### 8.1. Konfigurasi Manifest PWA (`public/manifest.json`)
```json
{
  "name": "Toko Martinez Self-Service",
  "short_name": "TokoMartinez",
  "description": "Aplikasi Kasir Mandiri & Kulkas Toko Martinez",
  "start_url": "/checkout",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0284c7",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 8.2. Langkah Pembuatan APK via Bubblewrap (TWA)
Metode *Trusted Web Activity* (TWA) memungkinkan PWA dibungkus menjadi installer APK Android resmi tanpa menulis native code:

1. **Instalasi CLI:**
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. **Inisialisasi Project Android dari URL Vercel:**
   ```bash
   bubblewrap init --manifest https://toko-martinez.vercel.app/manifest.json
   ```
3. **Build File APK:**
   ```bash
   bubblewrap build
   ```
   *Output berupa file `app-release-signed.apk` yang bisa langsung di-install pada tablet toko atau HP Android warga.*
4. **Verifikasi Keaslian Domain (Digital Asset Links):**
   * Letakkan file `assetlinks.json` di folder `public/.well-known/assetlinks.json` pada project Next.js agar browser Android menghilangkan address bar (menjadikannya tampilan aplikasi native penuh).

---

## 9. Timeline & Milestone Implementasi

* **Milestone 1 (Hari 1-2):** Setup database Supabase, eksekusi DDL script, dan inisialisasi Next.js 14 App Router di Vercel.
* **Milestone 2 (Hari 3-4):** Modul Restock (Gudang -> Showcase) dan Modul Self-Checkout (QRIS, Saldo, Utang).
* **Milestone 3 (Hari 5):** Modul Stock Opname Pagi/Malam dan Perhitungan Selisih (Loss Valuation).
* **Milestone 4 (Hari 6):** Konfigurasi PWA Service Worker, pengujian offline banner, dan kompilasi APK via Bubblewrap.
