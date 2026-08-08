/**
 * Layout Canvas Builder — schema cho stack section kéo-thả trên /shop/theme.
 *
 * Thiết kế:
 * - 1 mảng ordered `sections` = source of truth (reorder = splice array).
 * - `type` quyết định component render + shape của `data` (discriminated union).
 * - `widthPreset` / layout presets thay cho input % thủ công.
 * - UI state (selection, sidebar) tách khỏi document persist.
 *
 * @see src/lib/shop-layout-canvas.ts — defaults, migrate, pure helpers
 */

/* ─── Layout / width presets (không dùng % freeform) ─── */

/**
 * Chiều ngang + nhịp lưới của section.
 * Renderer map preset → Tailwind / CSS grid — user chỉ chọn visual card.
 */
export type LayoutWidthPreset =
  /** Tràn full viewport (edge-to-edge) */
  | "FULL_BLEED"
  /** Max container (max-w-7xl) căn giữa — mặc định shop */
  | "CONTAINER"
  /** Container hẹp (editorial / text) */
  | "NARROW"
  /** 2 cột 50/50 */
  | "SPLIT_50_50"
  /** 2 cột feature trái */
  | "SPLIT_70_30"
  /** 2 cột feature phải */
  | "SPLIT_30_70"
  /** 2 cột 40/60 */
  | "SPLIT_40_60"
  /** Lưới 2 cột đều */
  | "GRID_2"
  /** Lưới 3 cột */
  | "GRID_3"
  /** Lưới 4 cột (desktop) */
  | "GRID_4"
  /** Ô bento nổi (1 large + satellites) — hero / deal */
  | "BENTO_FEATURE"
  /** Masonry / staggered catalog */
  | "MASONRY";

/** Khoảng đệm dọc section — preset, không nhập px */
export type LayoutSpacingPreset = "none" | "compact" | "normal" | "spacious" | "hero";

/** Bo góc */
export type LayoutRadiusPreset = "none" | "md" | "xl" | "2xl" | "pill";

/**
 * Nền section — visual preset; `custom` mới dùng hex trong styling.customBg.
 */
export type LayoutBgPreset =
  | "inherit"
  | "surface"
  | "muted"
  | "primary"
  | "accent"
  | "dark"
  | "gradient-amber"
  | "gradient-rose"
  | "gradient-emerald"
  | "gradient-brand"
  | "custom";

/** Tone chữ trên nền */
export type LayoutTextTone = "auto" | "dark" | "light" | "muted" | "brand";

/* ─── Section type catalog ─── */

/**
 * Catalog section storefront.
 * Dùng SCREAMING_SNAKE để dễ phân biệt với legacy id kebab (`hero`, `flash-sale`).
 */
export type LayoutSectionType =
  | "ANNOUNCEMENT"
  | "HEADER"
  | "HERO"
  | "TRUST_BADGES"
  | "CATEGORY_RAIL"
  | "FLASH_SALE"
  | "COUPONS"
  | "HOT_PRODUCTS"
  | "PRODUCT_GRID"
  | "PRODUCT_CAROUSEL"
  | "EDITORIAL"
  | "REVIEWS"
  | "CONTACT_FOOTER"
  /* ── Khối tuỳ biến mở rộng ── */
  | "IMAGE_BANNER"
  | "VIDEO_BLOCK"
  | "TEXT_BLOCK"
  | "CTA_BANNER"
  | "FEATURE_GRID"
  | "STATS"
  | "GALLERY"
  | "LOGO_CLOUD"
  | "FAQ"
  | "NEWSLETTER"
  | "SPACER"
  | "DIVIDER"
  /** Container rỗng — chứa thành phần con bên trong */
  | "CONTAINER";

/* ─── Styling (appearance only) ─── */

/** Hiệu ứng xuất hiện khi section vào viewport */
export type LayoutAnimationPreset =
  | "none"
  | "fade-up"
  | "fade"
  | "scale"
  | "slide-left"
  | "slide-right"
  | "blur-in"
  | "zoom-soft";

/** Đổ bóng / elevation */
export type LayoutShadowPreset =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "glow"
  | "inner";

/** Blur / glass morphism */
export type LayoutBlurPreset =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "glass"
  | "frosted";

/** Hover micro-interaction trên cả section */
export type LayoutHoverPreset =
  | "none"
  | "lift"
  | "scale"
  | "glow"
  | "brightness"
  | "border-accent";

/** Viền section */
export type LayoutBorderPreset =
  | "none"
  | "subtle"
  | "solid"
  | "dashed"
  | "accent";

/* ─── Flex / Grid display config ─── */

export type LayoutDisplayMode = "block" | "flex" | "grid";
export type LayoutFlexDirection =
  | "row"
  | "column"
  | "row-reverse"
  | "column-reverse";
export type LayoutFlexWrap = "nowrap" | "wrap" | "wrap-reverse";
export type LayoutJustify =
  | "start"
  | "center"
  | "end"
  | "between"
  | "around"
  | "evenly";
export type LayoutAlignItems =
  | "start"
  | "center"
  | "end"
  | "stretch"
  | "baseline";
export type LayoutGridCols = 1 | 2 | 3 | 4 | 5 | 6;
export type LayoutGapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Cấu hình Flex/Grid cho khối — desktop + override mobile.
 * Áp vào shell section (display layout).
 */
export interface LayoutFlexGridConfig {
  display?: LayoutDisplayMode;
  /** Flex */
  direction?: LayoutFlexDirection;
  wrap?: LayoutFlexWrap;
  justify?: LayoutJustify;
  align?: LayoutAlignItems;
  /** Grid columns */
  cols?: LayoutGridCols;
  colsMd?: LayoutGridCols;
  colsLg?: LayoutGridCols;
  /** Gap */
  gap?: LayoutGapSize;
  /** Override &lt; md */
  mobile?: {
    display?: LayoutDisplayMode;
    direction?: LayoutFlexDirection;
    wrap?: LayoutFlexWrap;
    justify?: LayoutJustify;
    align?: LayoutAlignItems;
    cols?: LayoutGridCols;
    gap?: LayoutGapSize;
  };
}

export interface LayoutSectionStyling {
  bgPreset: LayoutBgPreset;
  /** Chỉ dùng khi bgPreset === "custom" */
  customBg?: string;
  textTone: LayoutTextTone;
  paddingY: LayoutSpacingPreset;
  paddingX: LayoutSpacingPreset;
  radius: LayoutRadiusPreset;
  /**
   * Shadow / elevation (legacy field `elevation` giữ tương thích).
   * Ưu tiên `shadow` nếu có.
   */
  elevation?: LayoutShadowPreset | "none" | "sm" | "md" | "lg";
  shadow?: LayoutShadowPreset;
  /** Backdrop blur / glass */
  blur?: LayoutBlurPreset;
  /** Hover effect */
  hover?: LayoutHoverPreset;
  /** Border style */
  border?: LayoutBorderPreset;
  /** Ẩn section trên mobile/desktop mà không xóa khỏi canvas */
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  /**
   * Animation khi cuộn tới section.
   * `none` = tắt; mặc định `fade-up` cho khối nội dung.
   */
  animation?: LayoutAnimationPreset;
  /** Flex / Grid + responsive display */
  flexGrid?: LayoutFlexGridConfig;
}

/* ─── Content data — discriminated by type ─── */

export interface LayoutHeroData {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  /** Ảnh / video cover (URL) */
  mediaUrl?: string;
  mediaType?: "image" | "video" | "none";
  /** Biến thể visual hero — preset, không % */
  heroVariant?:
    | "banner"
    | "bento"
    | "split"
    | "full-viewport"
    | "minimal-focus"
    | "video-reel";
}

export interface LayoutAnnouncementData {
  text: string;
  linkHref?: string;
  dismissible?: boolean;
}

export interface LayoutHeaderData {
  style: "minimal" | "branded" | "island" | "utility" | "compact";
  showSearch?: boolean;
  showCart?: boolean;
  /**
   * Cố định header khi cuộn trang.
   * - static: cuộn theo trang (mặc định)
   * - sticky: dính mép trên viewport khi cuộn
   * - fixed: neo tuyệt đối (cần khoảng đệm nội dung)
   */
  position?: "static" | "sticky" | "fixed";
}

export interface LayoutTrustBadgesData {
  items: Array<{
    id: string;
    label: string;
    icon?: "truck" | "shield" | "clock" | "phone" | "gift" | "star";
  }>;
}

export interface LayoutCategoryRailData {
  style: "pills" | "chips" | "icons" | "underline" | "stories" | "tree";
  /** null = lấy toàn bộ category từ BE */
  categoryIds?: number[] | null;
  title?: string;
}

export interface LayoutFlashSaleData {
  title: string;
  subtitle?: string;
  /** ISO end time — countdown */
  endsAt?: string | null;
  /** null = auto pick is_flash_sale products */
  productIds?: number[] | null;
  maxItems?: number;
}

export interface LayoutCouponsData {
  title: string;
  /** null = load coupons từ API shop */
  couponIds?: number[] | null;
}

export interface LayoutHotProductsData {
  title: string;
  subtitle?: string;
  productIds?: number[] | null;
  maxItems?: number;
}

export interface LayoutProductGridData {
  title?: string;
  subtitle?: string;
  /** Mật độ ô — map sang grid gap / card size */
  density: "cozy" | "comfortable" | "dense" | "airy";
  cardStyle:
    | "compact"
    | "comfortable"
    | "bordered"
    | "overlay"
    | "editorial"
    | "list";
  /** null = full catalog; number[] = curated */
  productIds?: number[] | null;
  categoryId?: number | null;
  showFilters?: boolean;
}

export interface LayoutEditorialData {
  title: string;
  body: string;
  mediaUrl?: string;
  ctaText?: string;
  ctaHref?: string;
  /** Image left/right — dùng cùng SPLIT_* widthPreset */
  mediaSide?: "left" | "right";
}

export interface LayoutReviewsData {
  title: string;
  subtitle?: string;
  /** null = demo / API reviews */
  reviewSource?: "demo" | "api";
}

export interface LayoutContactFooterData {
  title?: string;
  phone?: string;
  zalo?: string;
  facebook?: string;
  website?: string;
  address?: string;
  showMap?: boolean;
}

export interface LayoutProductCarouselData {
  title?: string;
  subtitle?: string;
  productIds?: number[] | null;
  maxItems?: number;
  cardStyle?: "compact" | "comfortable" | "overlay" | "editorial";
}

export interface LayoutImageBannerData {
  imageUrl: string;
  alt?: string;
  href?: string;
  /** Chiều cao visual */
  height?: "sm" | "md" | "lg" | "xl";
  objectFit?: "cover" | "contain";
}

export interface LayoutVideoBlockData {
  title?: string;
  /** YouTube / Vimeo / file URL */
  videoUrl: string;
  posterUrl?: string;
  autoplay?: boolean;
}

export interface LayoutTextBlockData {
  eyebrow?: string;
  title: string;
  body: string;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
}

export interface LayoutCtaBannerData {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaHref?: string;
  secondaryText?: string;
  secondaryHref?: string;
  variant?: "solid" | "gradient" | "outline";
}

export interface LayoutFeatureGridData {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  items: Array<{
    id: string;
    title: string;
    body?: string;
    icon?: "truck" | "shield" | "clock" | "phone" | "gift" | "star" | "heart" | "zap";
  }>;
}

export interface LayoutStatsData {
  title?: string;
  items: Array<{
    id: string;
    value: string;
    label: string;
  }>;
}

export interface LayoutGalleryData {
  title?: string;
  columns?: 2 | 3 | 4;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    href?: string;
  }>;
}

export interface LayoutLogoCloudData {
  title?: string;
  logos: Array<{
    id: string;
    name: string;
    imageUrl?: string;
  }>;
}

export interface LayoutFaqData {
  title?: string;
  subtitle?: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface LayoutNewsletterData {
  title: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  /** Hint only — FE không gửi mail thật trong canvas */
  successHint?: string;
}

export interface LayoutSpacerData {
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

export interface LayoutDividerData {
  style: "line" | "dashed" | "dots";
  label?: string;
}

/* ─── Container nested children ─── */

/** Thành phần con bên trong CONTAINER (không phải section full-page) */
export type LayoutContainerChildType =
  | "text"
  | "heading"
  | "image"
  | "button"
  | "spacer"
  | "divider"
  | "badge"
  | "html";

export interface LayoutContainerChildBase {
  id: string;
  type: LayoutContainerChildType;
}

export type LayoutContainerChild =
  | (LayoutContainerChildBase & {
      type: "text";
      data: { text: string; align?: "left" | "center" | "right"; muted?: boolean };
    })
  | (LayoutContainerChildBase & {
      type: "heading";
      data: {
        text: string;
        level?: 1 | 2 | 3;
        align?: "left" | "center" | "right";
      };
    })
  | (LayoutContainerChildBase & {
      type: "image";
      data: {
        url: string;
        alt?: string;
        href?: string;
        aspect?: "auto" | "video" | "square" | "wide";
      };
    })
  | (LayoutContainerChildBase & {
      type: "button";
      data: {
        label: string;
        href?: string;
        variant?: "primary" | "secondary" | "ghost";
      };
    })
  | (LayoutContainerChildBase & {
      type: "spacer";
      data: { size?: "sm" | "md" | "lg" };
    })
  | (LayoutContainerChildBase & {
      type: "divider";
      data: { label?: string };
    })
  | (LayoutContainerChildBase & {
      type: "badge";
      data: { text: string };
    })
  | (LayoutContainerChildBase & {
      type: "html";
      data: { html: string };
    });

export interface LayoutContainerData {
  /** Nhãn hiển thị trong builder (tuỳ chọn) */
  title?: string;
  /** Layout nội dung con */
  layout: "stack" | "row" | "grid-2" | "grid-3";
  gap?: "none" | "sm" | "md" | "lg";
  /** Căn dọc khi row */
  align?: "start" | "center" | "end" | "stretch";
  /** Min height khi rỗng — dễ click thêm */
  minHeight?: "sm" | "md" | "lg";
  /** Widget nhỏ: text, ảnh, nút… */
  children: LayoutContainerChild[];
  /**
   * Block section đầy đủ lồng trong container (Hero, Grid, FAQ…).
   * Không nên lồng CONTAINER quá sâu (UI giới hạn).
   */
  nestedBlocks?: LayoutSection[];
}

/** Map type → data shape (type-level) */
export type LayoutSectionDataByType = {
  ANNOUNCEMENT: LayoutAnnouncementData;
  HEADER: LayoutHeaderData;
  HERO: LayoutHeroData;
  TRUST_BADGES: LayoutTrustBadgesData;
  CATEGORY_RAIL: LayoutCategoryRailData;
  FLASH_SALE: LayoutFlashSaleData;
  COUPONS: LayoutCouponsData;
  HOT_PRODUCTS: LayoutHotProductsData;
  PRODUCT_GRID: LayoutProductGridData;
  PRODUCT_CAROUSEL: LayoutProductCarouselData;
  EDITORIAL: LayoutEditorialData;
  REVIEWS: LayoutReviewsData;
  CONTACT_FOOTER: LayoutContactFooterData;
  IMAGE_BANNER: LayoutImageBannerData;
  VIDEO_BLOCK: LayoutVideoBlockData;
  TEXT_BLOCK: LayoutTextBlockData;
  CTA_BANNER: LayoutCtaBannerData;
  FEATURE_GRID: LayoutFeatureGridData;
  STATS: LayoutStatsData;
  GALLERY: LayoutGalleryData;
  LOGO_CLOUD: LayoutLogoCloudData;
  FAQ: LayoutFaqData;
  NEWSLETTER: LayoutNewsletterData;
  SPACER: LayoutSpacerData;
  DIVIDER: LayoutDividerData;
  CONTAINER: LayoutContainerData;
};

/* ─── Section object ─── */

interface LayoutSectionBase {
  /** UUID — ổn định qua reorder */
  id: string;
  /** Bật/tắt hiển thị (không xóa khỏi mảng) */
  enabled: boolean;
  /**
   * Section bắt buộc (vd. PRODUCT_GRID) — UI không cho xóa, có thể ẩn.
   */
  locked?: boolean;
  /** Preset chiều ngang / lưới */
  widthPreset: LayoutWidthPreset;
  styling: LayoutSectionStyling;
  /** Tên hiển thị trong List View / Layers (đổi tên section) */
  label?: string;
  /** Group id — gộp nhiều section (kéo cả group) */
  groupId?: string | null;
  /** Khoá chỉnh sửa nội dung (vẫn reorder được trừ khi locked) */
  editorLocked?: boolean;
  /**
   * Override style trên mobile (&lt; md).
   * Merge shallow lên `styling` khi viewport mobile / devicePreview=mobile.
   */
  stylingMobile?: Partial<LayoutSectionStyling>;
  /** Override width trên mobile */
  widthPresetMobile?: LayoutWidthPreset;
}

/**
 * Discriminated union: `type` khóa shape của `data`.
 * Khi render: `switch (section.type)` → component + typed data.
 */
export type LayoutSection = {
  [T in LayoutSectionType]: LayoutSectionBase & {
    type: T;
    data: LayoutSectionDataByType[T];
  };
}[LayoutSectionType];

/* ─── Persisted canvas document ─── */

/** Schema version — bump khi breaking change + migrate trong lib */
export type LayoutCanvasSchemaVersion = 1;

/** Global design tokens cho canvas (override brand shop khi set) */
export interface LayoutCanvasGlobalTokens {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  radius?: LayoutRadiusPreset;
  /** Giảm animation/blur khi bật performance mode */
  performanceMode?: boolean;
}

/**
 * Document lưu trong personalization JSON (BE opaque).
 * Chỉ chứa này + sections — không nhét UI selection.
 */
export interface LayoutCanvasDocument {
  schemaVersion: LayoutCanvasSchemaVersion;
  sections: LayoutSection[];
  /**
   * Theme tokens toàn trang (optional override).
   * Màu global vẫn ưu tiên field top-level ShopPersonalizationData.
   */
  page?: {
    maxWidthPreset?: "sm" | "md" | "lg" | "xl" | "full";
    sectionGap?: LayoutSpacingPreset;
    tokens?: LayoutCanvasGlobalTokens;
    /** Ghi chú / tên layout (export) */
    title?: string;
  };
  /**
   * Snapshot versions lưu kèm document (client-side; BE opaque).
   * Dùng cho khôi phục nhanh — không thay history server.
   */
  versions?: LayoutCanvasVersionMeta[];
}

export interface LayoutCanvasVersionMeta {
  id: string;
  name: string;
  createdAt: string;
  /** sections JSON compact */
  sectionsSnapshot: LayoutSection[];
  pageSnapshot?: LayoutCanvasDocument["page"];
}

/** Pattern (bộ section sẵn) — catalog UI, không persist trong document */
export interface LayoutPatternDefinition {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /** Factory trả sections mới (id unique) */
  build: () => LayoutSection[];
}

/* ─── Ephemeral UI state (React only — không persist BE) ─── */

export interface LayoutCanvasUIState {
  /** Section đang chọn để edit properties */
  activeSectionId: string | null;
  /** Panel thuộc tính (phải / drawer) */
  sidebarOpen: boolean;
  /** Preview device */
  devicePreview: "desktop" | "mobile";
  isFullscreen: boolean;
  /**
   * Drag index — chỉ trong lúc kéo; clear on drop/cancel.
   * Không serialize.
   */
  dragFromIndex: number | null;
  dragOverIndex: number | null;
}

export const DEFAULT_LAYOUT_CANVAS_UI_STATE: LayoutCanvasUIState = {
  activeSectionId: null,
  sidebarOpen: true,
  devicePreview: "desktop",
  isFullscreen: false,
  dragFromIndex: null,
  dragOverIndex: null,
};

/* ─── Catalog metadata (UI palette — không nằm trong document) ─── */

export interface LayoutSectionTypeMeta {
  type: LayoutSectionType;
  /** Label tiếng Việt cho builder */
  label: string;
  description: string;
  /** Badge UI (Hot, Bắt buộc…) */
  badge?: string;
  /** widthPreset gợi ý khi add section */
  defaultWidthPreset: LayoutWidthPreset;
  /** Section không được xóa khỏi stack */
  lockedByDefault?: boolean;
  /** Map về legacy kebab id (sectionOrder cũ) */
  legacyId: string;
}

/* ─── Zustand / page store shape (optional composition) ─── */

/**
 * Gợi ý state layer cho builder page:
 * ```
 * useLayoutCanvasStore = {
 *   document: LayoutCanvasDocument,
 *   ui: LayoutCanvasUIState,
 *   actions: { reorder, select, patchSection, ... }
 * }
 * ```
 * Document ↔ personalization.layoutCanvas; UI local.
 */
export interface LayoutCanvasStoreSlice {
  document: LayoutCanvasDocument;
  ui: LayoutCanvasUIState;
}
