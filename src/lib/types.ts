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

export type Customer = {
  id: string;
  full_name: string;
  role: "customer" | "staff" | "admin";
  is_active: boolean;
};

export type PaymentMethod = "qris" | "deposit" | "debt" | "cash";

export type CartItem = {
  product: Product;
  quantity: number;
};
