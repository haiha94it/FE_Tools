import { createSampleLayoutCanvas } from "@/lib/shop-layout-canvas";
import type {
  ShopArchetypeId,
  ShopPersonalizationData,
  ShopTemplateId,
} from "@/types/zalo-shop";

/** Giá trị mặc định = Bento Grid Tech */
export const DEFAULT_SHOP_PERSONALIZATION: Required<ShopPersonalizationData> = {
  templateId: "bento-grid-tech",
  themeMode: "light",
  primaryColor: "#1D1D1F",
  accentColor: "#0071E3",
  backgroundColor: "#F5F5F7",
  surfaceColor: "#FFFFFF",
  mutedColor: "#6E6E73",
  pageLayout: "bento-tech",
  heroLayout: "bento",
  headerStyle: "island",
  productCardStyle: "comfortable",
  gridDensity: "airy",
  categoryStyle: "underline",
  heroTitle: "",
  heroSubtitle: "",
  ctaText: "Xem sản phẩm",
  announcement: "",
  showHero: true,
  showAnnouncement: false,
  showFlashSale: false,
  showCategoryRail: true,
  showReviews: true,
  showTrustBadges: true,
  showHotBadge: false,
  showFlashBadge: false,
  showStickyBuyBar: true,
  showBottomNav: false,
  showPersistentCartStrip: false,
  sectionOrder: [
    "hero",
    "category-rail",
    "flash-sale",
    "product-feed",
    "editorial",
    "reviews",
  ],
  sectionVisibility: {
    hero: true,
    "category-rail": true,
    "flash-sale": true,
    "product-feed": true,
    editorial: true,
    reviews: true,
  },
  blockConfigs: {},
  /** Canvas builder — sample Header + Hero + Grid stack */
  layoutCanvas: createSampleLayoutCanvas(),
  pdpLayoutCanvas: {
    schemaVersion: 1,
    page: { maxWidthPreset: "xl", sectionGap: "normal" },
    sections: [],
  },
  pdpTemplateId: "bento-tech",
  contactPhone: "",
  contactZalo: "",
  contactFacebook: "",
  contactWebsite: "",
  contactAddress: "",
};

export const ARCHETYPE_IDS: ShopArchetypeId[] = [
  "custom-drag-drop",
  "bento-grid-tech",
  "deal-wall-flash",
  "catalog-first-masonry",
  "split-storyteller",
  "sidebar-commerce",
  "mobile-native",
  "magazine-editorial",
  "minimalist-essential",
];

/** Map template cũ → archetype mới (backward compatible) */
const LEGACY_TEMPLATE_MAP: Record<string, ShopArchetypeId> = {
  "modern-commerce": "bento-grid-tech",
  "apple-clean": "bento-grid-tech",
  "minimal-white": "minimalist-essential",
  "paper-gallery": "minimalist-essential",
  "nordic-calm": "catalog-first-masonry",
  "product-wall": "catalog-first-masonry",
  "neon-pop": "deal-wall-flash",
  "shopee-style": "deal-wall-flash",
  "sunset-sale": "deal-wall-flash",
  "bold-marketplace": "deal-wall-flash",
  "zalo-express": "deal-wall-flash",
  "dark-luxury": "split-storyteller",
  "midnight-runway": "split-storyteller",
  "electric-lime": "split-storyteller",
  "soft-pastel": "magazine-editorial",
  "lavender-spa": "magazine-editorial",
  "mosaic-burst": "magazine-editorial",
  "earth-organic": "catalog-first-masonry",
  "ocean-fresh": "bento-grid-tech",
  "sidebar-bazaar": "sidebar-commerce",
  "obsidian-tech": "sidebar-commerce",
};

export function resolveArchetypeId(
  templateId?: string | null,
): ShopArchetypeId {
  if (!templateId) return "bento-grid-tech";
  if ((ARCHETYPE_IDS as string[]).includes(templateId)) {
    return templateId as ShopArchetypeId;
  }
  return LEGACY_TEMPLATE_MAP[templateId] ?? "bento-grid-tech";
}

export type TemplateCategory =
  | "tech"
  | "marketplace"
  | "fashion"
  | "brand"
  | "utility"
  | "mobile"
  | "editorial"
  | "minimal";

export interface ShopTemplatePreset {
  id: ShopArchetypeId;
  name: string;
  description: string;
  philosophy: string;
  inspiredBy: string;
  tags: string[];
  category: TemplateCategory;
  pageLayoutLabel: string;
  preview: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
  };
  data: Partial<ShopPersonalizationData>;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  tech: "Công Nghệ Cao Cấp",
  marketplace: "Khuyến Mãi & Săn Deal",
  fashion: "Bộ Sưu Tập & Masonry",
  brand: "Thương Hiệu & D2C",
  utility: "Ứng Dụng & B2B",
  mobile: "Giao Diện Di Động PWA",
  editorial: "Tạp Chí & Cao Cấp",
  minimal: "Tối Giản Tinh Tế",
};

export const SHOP_TEMPLATE_PRESETS: ShopTemplatePreset[] = [
  {
    id: "custom-drag-drop",
    name: "Custom Drag & Drop Canvas",
    description:
      "Tự do sắp xếp thứ tự & ẩn/hiện các khối Banner, Danh Mục, Flash Sale, Lưới Sản Phẩm, Review",
    philosophy: "Tự do sáng tạo không giới hạn, kéo thả trực quan theo phong cách riêng của thương hiệu",
    inspiredBy: "Công cụ Tự Thiết Kế / Canvas Builder",
    tags: ["Kéo Thả Trực Quan", "Custom Canvas", "Tùy Biến 100%"],
    category: "brand",
    pageLayoutLabel: "Custom Builder · Kéo Thả Canvas",
    preview: {
      bg: "#0F172A",
      surface: "#1E293B",
      primary: "#F59E0B",
      accent: "#3B82F6",
    },
    data: {
      templateId: "custom-drag-drop",
      themeMode: "light",
      primaryColor: "#0F172A",
      accentColor: "#F59E0B",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      mutedColor: "#64748B",
      pageLayout: "custom-builder",
      heroLayout: "bento",
      headerStyle: "island",
      productCardStyle: "comfortable",
      gridDensity: "airy",
      categoryStyle: "chips",
      showHero: true,
      showFlashSale: true,
      showAnnouncement: true,
      announcement: "🎨 Gian hàng tự do sáng tạo UI theo phong cách của bạn",
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: true,
      showBottomNav: false,
      showPersistentCartStrip: false,
      showHotBadge: true,
      showFlashBadge: true,
      ctaText: "Khám phá ngay",
      sectionOrder: [
        "hero",
        "category-rail",
        "flash-sale",
        "product-feed",
        "editorial",
        "reviews",
      ],
      sectionVisibility: {
        hero: true,
        "category-rail": true,
        "flash-sale": true,
        "product-feed": true,
        editorial: true,
        reviews: true,
      },
    },
  },
  {
    id: "bento-grid-tech",
    name: "Bento Grid Công Nghệ",
    description:
      "Hero bento bất đối xứng · thanh điều hướng kính mờ · lưới 3 cột thoáng · thanh mua hàng cố định",
    philosophy: "Tối giản, sản phẩm như tác phẩm nghệ thuật, khoảng trống cao (Phong cách Apple)",
    inspiredBy: "Phong cách Apple / Công nghệ cao cấp",
    tags: ["Bento", "Thanh kính mờ", "Thanh mua cố định"],
    category: "tech",
    pageLayoutLabel: "Bento · Kính mờ · Lưới 3 cột",
    preview: {
      bg: "#F5F5F7",
      surface: "#FFFFFF",
      primary: "#1D1D1F",
      accent: "#0071E3",
    },
    data: {
      templateId: "bento-grid-tech",
      themeMode: "light",
      primaryColor: "#1D1D1F",
      accentColor: "#0071E3",
      backgroundColor: "#F5F5F7",
      surfaceColor: "#FFFFFF",
      mutedColor: "#6E6E73",
      pageLayout: "bento-tech",
      heroLayout: "bento",
      headerStyle: "island",
      productCardStyle: "comfortable",
      gridDensity: "airy",
      categoryStyle: "underline",
      showHero: true,
      showFlashSale: false,
      showAnnouncement: false,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: true,
      showBottomNav: false,
      showPersistentCartStrip: false,
      showHotBadge: false,
      showFlashBadge: false,
      ctaText: "Xem sản phẩm",
      heroTitle: "",
      heroSubtitle: "",
      pdpTemplateId: "bento-tech",
    },
  },
  {
    id: "deal-wall-flash",
    name: "Deal Wall & Flash Sale",
    description:
      "Tìm kiếm toàn màn hình · hero 60/40 deal · đếm ngược flash sale · lưới 5 cột dày",
    philosophy: "Mật độ sản phẩm cao, tạo cảm giác gấp rút, tối ưu chuyển đổi",
    inspiredBy: "Phong cách Shopee / Sàn TMĐT",
    tags: ["Flash Sale", "Lưới 5 cột", "Săn Deal"],
    category: "marketplace",
    pageLayoutLabel: "Deal Split · Lưới 5 cột",
    preview: {
      bg: "#FFF7ED",
      surface: "#FFFFFF",
      primary: "#9A3412",
      accent: "#EA580C",
    },
    data: {
      templateId: "deal-wall-flash",
      themeMode: "light",
      primaryColor: "#9A3412",
      accentColor: "#EA580C",
      backgroundColor: "#FFF7ED",
      surfaceColor: "#FFFFFF",
      mutedColor: "#C2410C",
      pageLayout: "deal-wall",
      heroLayout: "deal-split",
      headerStyle: "utility",
      productCardStyle: "compact",
      gridDensity: "dense",
      categoryStyle: "chips",
      showHero: true,
      showFlashSale: true,
      showAnnouncement: true,
      announcement: "Flash Sale hôm nay — số lượng có hạn!",
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: false,
      showHotBadge: true,
      showFlashBadge: true,
      ctaText: "Săn deal ngay",
      pdpTemplateId: "dense-deal",
    },
  },
  {
    id: "catalog-first-masonry",
    name: "Bộ Sưu Tập & Masonry",
    description:
      "Không hero banner · story dạng tròn · lưới masonry đan xéo · giá phủ mờ",
    philosophy: "Trải nghiệm hình ảnh chân thực, lướt sản phẩm mượt mà",
    inspiredBy: "Phong cách Zara / IKEA / Thời trang",
    tags: ["Masonry", "Story Tròn", "Thời Trang"],
    category: "fashion",
    pageLayoutLabel: "Story · Nguồn cấp Masonry",
    preview: {
      bg: "#FAFAFA",
      surface: "#FFFFFF",
      primary: "#171717",
      accent: "#525252",
    },
    data: {
      templateId: "catalog-first-masonry",
      themeMode: "light",
      primaryColor: "#171717",
      accentColor: "#404040",
      backgroundColor: "#FAFAFA",
      surfaceColor: "#FFFFFF",
      mutedColor: "#737373",
      pageLayout: "catalog-masonry",
      heroLayout: "none",
      headerStyle: "minimal",
      productCardStyle: "overlay",
      gridDensity: "comfortable",
      categoryStyle: "stories",
      showHero: false,
      showFlashSale: false,
      showAnnouncement: false,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: false,
      ctaText: "Xem bộ sưu tập",
      pdpTemplateId: "editorial-story",
    },
  },
  {
    id: "split-storyteller",
    name: "Editorial Story / Thương Hiệu Cao Cấp",
    description:
      "Hero điện ảnh tràn màn hình · chương câu chuyện 50/50 · thẻ sản phẩm nổi bật",
    philosophy:
      "Truyền thông thương hiệu sang trọng, hình ảnh góc rộng điện ảnh",
    inspiredBy: "Phong cách Nike / Glossier / Thương hiệu D2C",
    tags: ["Hero điện ảnh", "Truyền thông", "Nổi bật"],
    category: "brand",
    pageLayoutLabel: "Tràn màn hình · Câu chuyện · Nổi bật",
    preview: {
      bg: "#0A0A0A",
      surface: "#171717",
      primary: "#FAFAFA",
      accent: "#F43F5E",
    },
    data: {
      templateId: "split-storyteller",
      themeMode: "dark",
      primaryColor: "#FAFAFA",
      accentColor: "#F43F5E",
      backgroundColor: "#0A0A0A",
      surfaceColor: "#171717",
      mutedColor: "#A3A3A3",
      pageLayout: "storyteller",
      heroLayout: "full-viewport",
      headerStyle: "branded",
      productCardStyle: "editorial",
      gridDensity: "cozy",
      categoryStyle: "underline",
      showHero: true,
      showFlashSale: false,
      showCategoryRail: false,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: false,
      ctaText: "Khám phá ngay",
      heroTitle: "",
      heroSubtitle: "",
      pdpTemplateId: "editorial-story",
    },
  },
  {
    id: "sidebar-commerce",
    name: "Bảng Điều Hướng Sidebar / B2B App",
    description:
      "Thanh bộ lọc 250px bên trái · công cụ lọc thông minh · thanh giỏ hàng cố định",
    philosophy: "Tối ưu thao tác lọc và tìm kiếm cho người mua sắm chuyên nghiệp",
    inspiredBy: "Phong cách ứng dụng chuyên nghiệp / B2B SaaS",
    tags: ["Sidebar trái", "Bộ lọc", "Thanh giỏ hàng"],
    category: "utility",
    pageLayoutLabel: "Ứng dụng Sidebar · Bảng thu nhỏ",
    preview: {
      bg: "#F1F5F9",
      surface: "#FFFFFF",
      primary: "#0F172A",
      accent: "#2563EB",
    },
    data: {
      templateId: "sidebar-commerce",
      themeMode: "light",
      primaryColor: "#0F172A",
      accentColor: "#2563EB",
      backgroundColor: "#F1F5F9",
      surfaceColor: "#FFFFFF",
      mutedColor: "#64748B",
      pageLayout: "sidebar-app",
      heroLayout: "none",
      headerStyle: "minimal",
      productCardStyle: "list",
      gridDensity: "dense",
      categoryStyle: "tree",
      showHero: false,
      showFlashSale: false,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: true,
      ctaText: "Thêm vào giỏ",
      pdpTemplateId: "dense-deal",
    },
  },
  {
    id: "mobile-native",
    name: "Giao Diện App Di Động",
    description:
      "Header gọn gàng · reel video 16:9 · lưới 2 cột chuẩn app · thanh điều hướng đáy PWA",
    philosophy: "Điều hướng bằng 1 ngón tay, định dạng nguồn cấp dọc",
    inspiredBy: "Phong cách TikTok Shop / App di động PWA",
    tags: ["App Di Động", "Lưới 2 cột", "Thanh đáy PWA"],
    category: "mobile",
    pageLayoutLabel: "PWA · Thanh điều hướng đáy · 2 cột",
    preview: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      primary: "#111827",
      accent: "#EC4899",
    },
    data: {
      templateId: "mobile-native",
      themeMode: "light",
      primaryColor: "#111827",
      accentColor: "#EC4899",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#FFFFFF",
      mutedColor: "#6B7280",
      pageLayout: "mobile-pwa",
      heroLayout: "video-reel",
      headerStyle: "compact",
      productCardStyle: "compact",
      gridDensity: "comfortable",
      categoryStyle: "stories",
      showHero: true,
      showFlashSale: true,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: true,
      showPersistentCartStrip: false,
      showFlashBadge: true,
      ctaText: "Mua ngay",
      pdpTemplateId: "dense-deal",
    },
  },
  {
    id: "magazine-editorial",
    name: "Tạp Chí Editorial Vogue",
    description:
      "Banner cover góc rộng · trích dẫn ấn tượng · thẻ font serif sang trọng 3 cột",
    philosophy: "Typography thời trang cao cấp, bố cục tạp chí nghệ thuật",
    inspiredBy: "Phong cách Vogue / Kinfolk / Thời trang",
    tags: ["Tạp chí Vogue", "Kính mờ", "Font Serif"],
    category: "editorial",
    pageLayoutLabel: "Tạp chí · Serif · Lưới 3 cột",
    preview: {
      bg: "#FAF8F5",
      surface: "#FFFFFF",
      primary: "#1C1917",
      accent: "#A8A29E",
    },
    data: {
      templateId: "magazine-editorial",
      themeMode: "light",
      primaryColor: "#1C1917",
      accentColor: "#78716C",
      backgroundColor: "#FAF8F5",
      surfaceColor: "#FFFFFF",
      mutedColor: "#A8A29E",
      pageLayout: "magazine",
      heroLayout: "editorial-pair",
      headerStyle: "minimal",
      productCardStyle: "editorial",
      gridDensity: "cozy",
      categoryStyle: "underline",
      showHero: true,
      showFlashSale: false,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: false,
      ctaText: "Xem sản phẩm",
      heroTitle: "",
      heroSubtitle: "",
      pdpTemplateId: "editorial-story",
    },
  },
  {
    id: "minimalist-essential",
    name: "Tối Giản Tinh Tế (Minimalist)",
    description:
      "Tập trung 1 sản phẩm chính · lưới 3 cột đường kẻ ngăn cách · giao diện đơn sắc",
    philosophy: "Bỏ mọi chi tiết thừa, tối đa khoảng trống thoáng",
    inspiredBy: "Phong cách MUJI / Tối giản Nhật Bản",
    tags: ["Tối giản", "Đường kẻ ngăn cách", "Đơn sắc"],
    category: "minimal",
    pageLayoutLabel: "Tập trung Hero · Lưới 3 cột đường kẻ",
    preview: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      primary: "#171717",
      accent: "#171717",
    },
    data: {
      templateId: "minimalist-essential",
      themeMode: "light",
      primaryColor: "#171717",
      accentColor: "#171717",
      backgroundColor: "#FFFFFF",
      surfaceColor: "#FFFFFF",
      mutedColor: "#A3A3A3",
      pageLayout: "minimal-grid",
      heroLayout: "minimal-focus",
      headerStyle: "minimal",
      productCardStyle: "bordered",
      gridDensity: "airy",
      categoryStyle: "underline",
      showHero: true,
      showFlashSale: false,
      showAnnouncement: false,
      showCategoryRail: true,
      showReviews: true,
      showStickyBuyBar: false,
      showBottomNav: false,
      showPersistentCartStrip: false,
      showHotBadge: false,
      showFlashBadge: false,
      ctaText: "Chọn",
      pdpTemplateId: "minimal-gallery",
    },
  },
];

export function getTemplatePreset(
  id?: string | null,
): ShopTemplatePreset | undefined {
  if (!id) return undefined;
  const archetype = resolveArchetypeId(id);
  return SHOP_TEMPLATE_PRESETS.find((t) => t.id === archetype);
}

export function groupTemplatesByCategory(): {
  category: TemplateCategory;
  label: string;
  items: ShopTemplatePreset[];
}[] {
  const order: TemplateCategory[] = [
    "tech",
    "marketplace",
    "fashion",
    "brand",
    "utility",
    "mobile",
    "editorial",
    "minimal",
  ];
  return order
    .map((category) => ({
      category,
      label: TEMPLATE_CATEGORY_LABELS[category],
      items: SHOP_TEMPLATE_PRESETS.filter((t) => t.category === category),
    }))
    .filter((g) => g.items.length > 0);
}

export function resolvePersonalization(
  raw?: ShopPersonalizationData | Record<string, unknown> | null,
): Required<ShopPersonalizationData> {
  const input = (raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw
    : {}) as ShopPersonalizationData;

  const archetype = resolveArchetypeId(input.templateId);
  const template = getTemplatePreset(archetype);
  const fromTemplate = template?.data ?? {};

  const pickBool = (
    key: keyof ShopPersonalizationData,
    fallback: boolean,
  ): boolean => {
    const v = input[key];
    if (typeof v === "boolean") return v;
    const t = fromTemplate[key];
    if (typeof t === "boolean") return t;
    return fallback;
  };

  return {
    ...DEFAULT_SHOP_PERSONALIZATION,
    ...fromTemplate,
    ...input,
    templateId: archetype,
    pageLayout:
      input.pageLayout ??
      fromTemplate.pageLayout ??
      DEFAULT_SHOP_PERSONALIZATION.pageLayout,
    heroLayout:
      input.heroLayout ??
      fromTemplate.heroLayout ??
      DEFAULT_SHOP_PERSONALIZATION.heroLayout,
    headerStyle:
      input.headerStyle ??
      fromTemplate.headerStyle ??
      DEFAULT_SHOP_PERSONALIZATION.headerStyle,
    categoryStyle:
      input.categoryStyle ??
      fromTemplate.categoryStyle ??
      DEFAULT_SHOP_PERSONALIZATION.categoryStyle,
    showHero: pickBool("showHero", DEFAULT_SHOP_PERSONALIZATION.showHero),
    showAnnouncement: pickBool(
      "showAnnouncement",
      DEFAULT_SHOP_PERSONALIZATION.showAnnouncement,
    ),
    showFlashSale: pickBool(
      "showFlashSale",
      DEFAULT_SHOP_PERSONALIZATION.showFlashSale,
    ),
    showCategoryRail: pickBool(
      "showCategoryRail",
      DEFAULT_SHOP_PERSONALIZATION.showCategoryRail,
    ),
    showReviews: pickBool("showReviews", DEFAULT_SHOP_PERSONALIZATION.showReviews),
    showTrustBadges: pickBool(
      "showTrustBadges",
      DEFAULT_SHOP_PERSONALIZATION.showTrustBadges,
    ),
    showHotBadge: pickBool(
      "showHotBadge",
      DEFAULT_SHOP_PERSONALIZATION.showHotBadge,
    ),
    showFlashBadge: pickBool(
      "showFlashBadge",
      DEFAULT_SHOP_PERSONALIZATION.showFlashBadge,
    ),
    showStickyBuyBar: pickBool(
      "showStickyBuyBar",
      DEFAULT_SHOP_PERSONALIZATION.showStickyBuyBar,
    ),
    showBottomNav: pickBool(
      "showBottomNav",
      DEFAULT_SHOP_PERSONALIZATION.showBottomNav,
    ),
    showPersistentCartStrip: pickBool(
      "showPersistentCartStrip",
      DEFAULT_SHOP_PERSONALIZATION.showPersistentCartStrip,
    ),
    pdpTemplateId:
      (typeof input.pdpTemplateId === "string" && input.pdpTemplateId) ||
      (typeof fromTemplate.pdpTemplateId === "string" &&
        fromTemplate.pdpTemplateId) ||
      DEFAULT_SHOP_PERSONALIZATION.pdpTemplateId,
    layoutCanvas:
      input.layoutCanvas &&
      typeof input.layoutCanvas === "object" &&
      Array.isArray(input.layoutCanvas.sections) &&
      input.layoutCanvas.sections.length > 0
        ? input.layoutCanvas
        : fromTemplate.layoutCanvas &&
            typeof fromTemplate.layoutCanvas === "object" &&
            Array.isArray(fromTemplate.layoutCanvas.sections) &&
            fromTemplate.layoutCanvas.sections.length > 0
          ? fromTemplate.layoutCanvas
          : DEFAULT_SHOP_PERSONALIZATION.layoutCanvas,
  };
}

export function applyTemplateToData(
  current: ShopPersonalizationData,
  templateId: ShopTemplateId,
  options?: { keepCopy?: boolean },
): ShopPersonalizationData {
  const preset = getTemplatePreset(templateId);
  if (!preset) return current;
  const next: ShopPersonalizationData = {
    ...current,
    ...preset.data,
    templateId: preset.id,
  };
  if (options?.keepCopy) {
    next.heroTitle = current.heroTitle;
    next.heroSubtitle = current.heroSubtitle;
    next.ctaText = current.ctaText;
    if (current.announcement) next.announcement = current.announcement;
  }
  return next;
}

export function personalizationToCssVars(
  config: Required<ShopPersonalizationData>,
): Record<string, string> {
  return {
    "--store-primary": config.primaryColor,
    "--store-accent": config.accentColor,
    "--store-accent-rose": config.accentColor,
    "--store-bg": config.backgroundColor,
    "--store-surface": config.surfaceColor,
    "--store-muted": config.mutedColor,
    "--store-secondary": "#1e293b",
  };
}

export function gridDensityClass(
  density: Required<ShopPersonalizationData>["gridDensity"],
): string {
  switch (density) {
    case "dense":
      return "gap-2 sm:gap-2.5";
    case "cozy":
      return "gap-5 sm:gap-6";
    case "airy":
      return "gap-6 sm:gap-8";
    default:
      return "gap-3 sm:gap-4";
  }
}

export function toSavePayload(
  data: ShopPersonalizationData,
): ShopPersonalizationData {
  const resolved = resolvePersonalization(data);
  return {
    templateId: resolved.templateId,
    themeMode: resolved.themeMode,
    primaryColor: resolved.primaryColor,
    accentColor: resolved.accentColor,
    backgroundColor: resolved.backgroundColor,
    surfaceColor: resolved.surfaceColor,
    mutedColor: resolved.mutedColor,
    pageLayout: resolved.pageLayout,
    heroLayout: resolved.heroLayout,
    headerStyle: resolved.headerStyle,
    productCardStyle: resolved.productCardStyle,
    gridDensity: resolved.gridDensity,
    categoryStyle: resolved.categoryStyle,
    heroTitle: resolved.heroTitle,
    heroSubtitle: resolved.heroSubtitle,
    ctaText: resolved.ctaText,
    announcement: resolved.announcement,
    showHero: resolved.showHero,
    showAnnouncement: resolved.showAnnouncement,
    showFlashSale: resolved.showFlashSale,
    showCategoryRail: resolved.showCategoryRail,
    showReviews: resolved.showReviews,
    showTrustBadges: resolved.showTrustBadges,
    showHotBadge: resolved.showHotBadge,
    showFlashBadge: resolved.showFlashBadge,
    showStickyBuyBar: resolved.showStickyBuyBar,
    showBottomNav: resolved.showBottomNav,
    showPersistentCartStrip: resolved.showPersistentCartStrip,
    pdpTemplateId: resolved.pdpTemplateId,
  };
}

/** @deprecated section-order approach replaced by archetype layouts */
export type StoreSectionId =
  | "hero"
  | "flash"
  | "categories"
  | "products"
  | "reviews";

export function getSectionOrder(): StoreSectionId[] {
  return ["hero", "flash", "categories", "products", "reviews"];
}

export const PAGE_LAYOUT_OPTIONS: {
  value: string;
  label: string;
  description: string;
}[] = SHOP_TEMPLATE_PRESETS.map((p) => ({
  value: p.data.pageLayout ?? p.id,
  label: p.name,
  description: p.pageLayoutLabel,
}));

export const HERO_LAYOUT_OPTIONS = [
  { value: "bento", label: "Bento asymmetric" },
  { value: "deal-split", label: "Deal split 60/40" },
  { value: "none", label: "No hero" },
  { value: "full-viewport", label: "Full viewport 100vh" },
  { value: "editorial-pair", label: "Editorial dual images" },
  { value: "minimal-focus", label: "Single product focus" },
  { value: "video-reel", label: "16:9 reel" },
] as const;
