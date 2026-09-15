import Link from "next/link";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-sky-700">Toko Martinez — Petugas</h1>
        <nav className="mt-2 flex gap-4 text-sm font-medium text-slate-600">
          <Link href="/admin" className="hover:text-sky-700">
            Dashboard
          </Link>
          <Link href="/admin/restock" className="hover:text-sky-700">
            Mutasi Stok
          </Link>
          <Link href="/admin/stock-opname" className="hover:text-sky-700">
            Stock Opname
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
