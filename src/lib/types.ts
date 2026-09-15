export type Role = "customer" | "staff" | "admin" | "superadmin";

export type Product = {
  id: string;
  sku: string | null;
  name: string;
  brand: string;
  category: string;
  image_url: string | null;
  bulk_unit: string;
  retail_unit: string;
  conversion_ratio: number;
  cost_price: number;
  retail_price: number;
  is_active: boolean;
};

export type Inventory = {
  product_id: string;
  warehouse_stock: number;
  showcase_stock: number;
  min_showcase_threshold: number;
};

export type ProductWithStock = Product & { inventory: Inventory | null };

/** Baris dari RPC admin_list_products (produk + stok, termasuk yang nonaktif). */
export type AdminProduct = {
  id: string;
  sku: string | null;
  name: string;
  brand: string;
  category: string;
  bulk_unit: string;
  retail_unit: string;
  conversion_ratio: number;
  cost_price: number;
  retail_price: number;
  is_active: boolean;
  warehouse_stock: number;
  showcase_stock: number;
  min_showcase_threshold: number;
};

export type CustomerOption = {
  id: string;
  full_name: string;
};

export type AdminUser = {
  id: string;
  full_name: string;
  phone: string | null;
  username: string | null;
  role: Role;
  deposit_balance: number;
  debt_balance: number;
  debt_limit: number;
  is_active: boolean;
  has_pin: boolean;
  has_password: boolean;
  locked: boolean;
  created_at: string;
};

export type SessionUser = {
  id: string;
  full_name: string;
  role: Role;
  username: string | null;
};

export type PaymentMethod = "qris" | "cash" | "deposit" | "debt";
