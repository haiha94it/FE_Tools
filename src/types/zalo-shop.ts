import type { LayoutCanvasDocument } from "@/types/shop-layout-canvas";

/** Danh mục cửa hàng */
export interface ShopCategory {
  id: number;
  name: string;
  status?: number;
  id_user?: number;
  user?: number;
  /** Ảnh đại diện danh mục — API field `avt` */
  avt?: string | null;
  /** Người tạo / sửa cuối (NV hoặc manager) */
  creator_name?: string | null;
  creator_user_name?: string | null;
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
  /** Người tạo / sửa cuối */
  creator_name?: string | null;
  creator_user_name?: string | null;
  user?: number;
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

/** Giỏ hàng — khớp CartItemSerializer BE */
export interface ShopCartItem {
  id: number;
  title: string;
  quantity: number;
  product_variant: ShopProductVariant;
  id_product_variant?: number;
  id_product?: number;
  image?: string | null;
  id_category?: number;
}

export interface ShopCart {
  items?: ShopCartItem[];
  total_amount?: number;
  session_key?: string;
  id_user?: number;
  id_employee?: number | string;
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
  discount_percentage?: number | string;
  discount_percent?: number;
  discount_amount?: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | string;
  is_used?: boolean;
  used_by?: string | null;
  expires_at?: string;
  created_at?: string;
  status?: number;
}

export interface CreateCouponsPayload {
  quantity: number;
  discount_percentage: number;
  max_discount_amount?: number | null;
  min_order_amount?: number;
  expires_days?: number;
}

/** 0 Đã hủy · 1 Đã xác nhận · 2 Chờ xác nhận */
export type ShopOrderStatus = 0 | 1 | 2;

export interface ShopOrderItem {
  id: number;
  title?: string;
  classify?: string;
  price?: number | string;
  quantity?: number;
  image?: string | null;
  options?: { name?: string; value?: string }[] | null;
  product_variant_id?: number;
  id_product?: number | null;
  id_category?: number | null;
}

export interface ShopOrder {
  id: number;
  user?: number;
  /** FK NV bán — null = đơn manager / không gắn NV */
  employee?: number | null;
  employee_name?: string | null;
  employee_username?: string | null;
  full_name?: string;
  phone_number?: string;
  city?: string;
  district?: string;
  ward?: string;
  address?: string;
  note?: string | null;
  description?: string | null;
  total_amount?: number | string | null;
  discount?: number | string | null;
  coupon_discount?: number | string | null;
  status?: ShopOrderStatus | number | string;
  created_at?: string;
  order_successful_message?: boolean;
  confirm_message_successful?: boolean;
  items?: ShopOrderItem[];
}

export interface ShopOrdersResponse {
  results: ShopOrder[];
  count: number;
}

export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  status?: number | string;
  key?: string;
  start_date?: string;
  end_date?: string;
  id_employee?: number | string;
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
  id_cover?: number;
  name?: string;
  image?: string | null;
  image_logo?: string | null;
}

export type ShopSortOption = "default" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

/**
 * 8 architectural storefront archetypes — mỗi id = DOM/wireframe khác hẳn.
 * String mở để dữ liệu cũ / BE không gãy; resolve map legacy → archetype.
 */
export type ShopTemplateId = string;

/** Canonical archetype IDs (structural templates) */
export type ShopArchetypeId =
  | "bento-grid-tech"
  | "deal-wall-flash"
  | "catalog-first-masonry"
  | "split-storyteller"
  | "sidebar-commerce"
  | "mobile-native"
  | "magazine-editorial"
  | "minimalist-essential"
  | "custom-drag-drop";

export type ShopProductCardStyle =
  | "compact"
  | "comfortable"
  | "bordered"
  | "overlay"
  | "editorial"
  | "list";

export type ShopHeroLayout =
  | "bento"
  | "deal-split"
  | "none"
  | "full-viewport"
  | "editorial-pair"
  | "minimal-focus"
  | "video-reel"
  | "split"
  | "centered"
  | "banner"
  /** legacy — kept for StoreHero fallback */
  | "full-bleed"
  | "mosaic"
  | "minimal-strip"
  | "showcase-left";

export type ShopPageLayout =
  | "bento-tech"
  | "deal-wall"
  | "catalog-masonry"
  | "storyteller"
  | "sidebar-app"
  | "mobile-pwa"
  | "magazine"
  | "minimal-grid"
  | "classic"
  | "custom-builder";

export type ShopHeaderStyle =
  | "minimal"
  | "branded"
  | "island"
  | "utility"
  | "compact"
  | "hidden-for-sidebar";

export type ShopGridDensity = "cozy" | "comfortable" | "dense" | "airy";
export type ShopCategoryStyle =
  | "pills"
  | "chips"
  | "icons"
  | "underline"
  | "stories"
  | "tree";

export interface ShopBlockConfig {
  customTitle?: string;
  customSubtitle?: string;
  columnSpan?: "full" | "half" | "third";
  bgStyle?: "default" | "dark" | "gradient-amber" | "gradient-rose" | "gradient-emerald" | "white" | "custom";
  customBgColor?: string;
  customTextColor?: string;
  customBorderColor?: string;
  padding?: "compact" | "normal" | "spacious";
  borderRadius?: "rounded-xl" | "rounded-2xl" | "rounded-3xl";
}

/**
 * Object JSON personalization — FE sở hữu schema.
 * BE chỉ lưu/trả nguyên `data`, không validate key.
 */
export interface ShopPersonalizationData {
  templateId?: ShopTemplateId;
  themeMode?: "light" | "dark";
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  mutedColor?: string;
  pageLayout?: ShopPageLayout;
  heroLayout?: ShopHeroLayout;
  headerStyle?: ShopHeaderStyle;
  productCardStyle?: ShopProductCardStyle;
  gridDensity?: ShopGridDensity;
  categoryStyle?: ShopCategoryStyle;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  announcement?: string;
  showHero?: boolean;
  showAnnouncement?: boolean;
  showFlashSale?: boolean;
  showCategoryRail?: boolean;
  showReviews?: boolean;
  showTrustBadges?: boolean;
  showHotBadge?: boolean;
  showFlashBadge?: boolean;
  /** Sticky buy bar (Bento Tech) */
  showStickyBuyBar?: boolean;
  /** Bottom tab bar (Mobile Native) */
  showBottomNav?: boolean;
  /** Cart summary drawer strip (Sidebar Commerce) */
  showPersistentCartStrip?: boolean;
  /** Thứ tự sắp xếp các khối UI trong Custom Builder (legacy — dual-write từ layoutCanvas) */
  sectionOrder?: string[];
  /** Trạng thái bật/tắt hiển thị từng khối UI (legacy) */
  sectionVisibility?: Record<string, boolean>;
  /** Cấu hình chi tiết từng khối (legacy — map từ LayoutSection.styling/data) */
  blockConfigs?: Record<string, ShopBlockConfig>;
  /**
   * Layout Canvas Builder v1 — source of truth cho stack section kéo-thả.
   * @see types/shop-layout-canvas.ts
   * Legacy sectionOrder / sectionVisibility / blockConfigs được sync khi save.
   */
  layoutCanvas?: LayoutCanvasDocument;
  /** Layout Canvas Builder cho trang chi tiết sản phẩm (PDP) */
  pdpLayoutCanvas?: LayoutCanvasDocument;
  /**
   * PDP template on /store/{id}/{cat}/{product}
   * @see PDPTemplateType in types/pdp-template.ts
   */
  pdpTemplateId?: string;
  /** Thông tin liên hệ & mạng xã hội */
  contactPhone?: string;
  contactZalo?: string;
  contactFacebook?: string;
  contactWebsite?: string;
  contactAddress?: string;
}

/** Envelope row personalization từ BE */
export interface ShopPersonalizationRecord {
  id: number | null;
  user?: number;
  data: ShopPersonalizationData | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}