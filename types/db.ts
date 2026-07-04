/**
 * Hand-written domain types mirroring docs/SCHEMA.md. (If you later run
 * `supabase gen types`, you can swap these for the generated Database type.)
 */

export type ProductStatus = "draft" | "active" | "archived";

export type PaymentMethod = "razorpay" | "cod";

export type PaymentStatus = "pending" | "paid" | "failed" | "unpaid";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "cash_on_delivery";

export type QuoteStatus = "new" | "contacted" | "closed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number; // paise; used when no variants
  stock: number; // used when no variants
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string; // e.g. "Size"
  variant_value: string; // e.g. "M"
  stock: number;
  price_override: number | null; // paise; falls back to product.price
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt: string | null;
  position: number;
  is_primary: boolean;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  offer_id: string | null;
  razorpay_order_id: string | null;
  subtotal_paise: number;
  shipping_paise: number;
  total: number; // paise
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number; // paise snapshot
}

export interface Offer {
  id: string;
  name: string;
  code: string;
  razorpay_offer_id: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  cart_snapshot: unknown | null;
  status: QuoteStatus;
  created_at: string;
}

/** A product with its images and variants joined — storefront view model. */
export interface ProductWithRelations extends Product {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

/** Guest cart line kept in localStorage. Identity = product_id + variant_id. */
export interface GuestCartLine {
  product_id: string;
  variant_id: string | null;
  quantity: number;
}
