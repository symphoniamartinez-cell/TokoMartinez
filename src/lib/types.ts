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

export type CashReconciliation = {
  cash_sales: number;
  qris_sales: number;
  cash_topup: number;
  qris_topup: number;
  cash_debt_payment: number;
  qris_debt_payment: number;
  total_cash_expected: number;
  total_qris_expected: number;
  total_expected: number;
  physical_cash: number | null;
  recon_difference: number | null;
  recon_recorded: boolean;
};

export type StockMovementRow = {
  product_id: string;
  product_name: string;
  retail_unit: string;
  stok_pagi: number | null;
  masuk: number;
  stok_malam: number | null;
  keluar_fisik: number | null;
  tercatat_terjual: number;
  selisih: number | null;
  nilai_selisih: number | null;
};

export type ProfitLoss = {
  revenue: number;
  cogs: number;
  gross_profit: number;
  shrinkage_loss: number;
  net_result: number;
  transaction_count: number;
};

export type ProfitLossByProduct = {
  product_id: string;
  product_name: string;
  qty_sold: number;
  revenue: number;
  cogs: number;
  margin: number;
};

export type PurchaseInvoiceRow = {
  id: string;
  invoice_number: string | null;
  supplier_name: string | null;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  item_count: number;
  received_by_name: string;
  created_at: string;
};
