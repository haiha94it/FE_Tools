/** Danh mục cửa hàng */
export interface ShopCategory {
  id: number;
  name: string;
  status?: number;
  id_user?: number;
  user?: number;
  /** Ảnh đại diện danh mục — API field `avt` */
  avt?: string | null;
  creator_name?: string | null;
}

/** Phân loại / biến thể sản phẩm */
export interface ShopProductVariant {
  id?: number;
  classify: string;
  price: number | string;
  promotion_price?: number | string | null;
  total_quantity: number | string;
  sold_quantity?: number | string;
  options?: ShopVariantOption[];
}

export interface ShopVariantOption {
  name: string;
  value: string;
}

/** Sản phẩm cửa hàng */
export interface ShopProduct {
  id: number;
  title: string;
  description?: string;
  phone_number?: string;
  category: number;
  status?: number;
  sell_option?: number;
  images: string[];
  variants: ShopProductVariant[];
  link_zalo?: string | null;
  original_video?: string | null;
  is_hot?: boolean;
  is_flash_sale?: boolean;
  image_hot?: string | null;
}

export interface ShopProductsResponse {
  results: ShopProduct[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

/** Bìa / branding cửa hàng */
export interface ShopCover {
  id?: number;
  name?: string;
  image?: string | null;
  image_logo?: string | null;
  user?: number;
}

export interface ShopDomainInfo {
  domain?: string;
  sample_link?: string;
}

/** Giỏ hàng */
export interface ShopCartItem {
  id: number;
  title: string;
  quantity: number;
  product_variant: ShopProductVariant;
}

export interface ShopCart {
  items?: ShopCartItem[];
  total_amount?: number;
  session_key?: string;
}

export interface AddToCartPayload {
  id_employee: number;
  session_key: string;
  options: { id_variant: number; quantity: number }[];
}

export interface CreateOrderPayload {
  id_employee: number | string;
  session_key: string;
  full_name: string;
  phone_number: string;
  city: string;
  ward: string;
  address: string;
  note?: string;
  coupon_code?: string;
  description?: string;
  total_amount?: number;
}

export interface ShopLocation {
  id: number;
  city?: string;
  ward?: string;
  district?: string;
}

export interface ShopCoupon {
  id: number;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  status?: number;
}

export interface ShopOrder {
  id: number;
  full_name?: string;
  phone_number?: string;
  address?: string;
  total_amount?: number;
  status?: number | string;
  created_at?: string;
  description?: string;
}

export interface ShopOrdersResponse {
  results: ShopOrder[];
  count: number;
}

export interface CreateCategoryPayload {
  id_user: number | string;
  name: string;
  id_category?: number;
  avt?: string | null;
}

export interface CreateProductPayload {
  id_account: number | string;
  id_category: number | string;
  title: string;
  description: string;
  phone_number?: string;
  sell_option: number;
  images: string[];
  variants: ShopProductVariant[];
  link_zalo?: string | null;
  video?: string | null;
  is_hot?: boolean;
  is_flash_sale?: boolean;
  image_hot?: string | null;
  id_product?: number;
}

export interface UpdateCoverPayload {
  id_user: number | string;
  name?: string;
  image?: string | null;
  image_logo?: string | null;
}

export type ShopSortOption = "default" | "price_asc" | "price_desc" | "name_asc" | "name_desc";