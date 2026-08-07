"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { ShopBlockConfig, ShopPersonalizationData, ShopProduct } from "@/types/zalo-shop";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiClock,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiGift,
  FiGrid,
  FiMapPin,
  FiMaximize2,
  FiMinimize2,
  FiMove,
  FiPercent,
  FiPhoneCall,
  FiRotateCcw,
  FiShield,
  FiShoppingBag,
  FiSmartphone,
  FiStar,
  FiTag,
  FiTruck,
  FiTv,
  FiZap,
} from "react-icons/fi";

// Demo products for live canvas preview
const DEMO_PRODUCTS: ShopProduct[] = [
  {
    id: 101,
    title: "Áo Thun Cotton Unisex High-End 2026",
    category: 1,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80",
    ],
    variants: [{ classify: "M / Đen", price: 350000, promotion_price: 249000, total_quantity: 50 }],
    is_flash_sale: true,
  },
  {
    id: 102,
    title: "Giày Sneaker Streetwear Limited Edition",
    category: 1,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
    ],
    variants: [{ classify: "42 / Trắng Red", price: 1250000, promotion_price: 990000, total_quantity: 20 }],
    is_hot: true,
  },
  {
    id: 103,
    title: "Túi Xách Da Cao Cấp Minimalist Elegance",
    category: 2,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=80",
    ],
    variants: [{ classify: "Tiêu chuẩn", price: 890000, total_quantity: 15 }],
    is_hot: true,
  },
  {
    id: 104,
    title: "Đồng Hồ Thông Minh Sport Smartwatch Pro",
    category: 3,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
    ],
    variants: [{ classify: "Titanium Grey", price: 2100000, promotion_price: 1790000, total_quantity: 30 }],
    is_flash_sale: true,
  },
];

export interface SectionDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

export const STOREFRONT_SECTIONS: SectionDefinition[] = [
  {
    id: "hero",
    name: "Hero Banner & Carousel",
    description: "Khối banner đỉnh trang, bento showcase hoặc video truyền thông",
    icon: FiGrid,
    badge: "Khối Đỉnh Trang",
  },
  {
    id: "trust-badges",
    name: "Thanh Cam Kết & Dịch Vụ Pro",
    description: "Giao hỏa tốc 2H, Đổi trả 7 ngày, Bảo hành chính hãng 100%, Hỗ trợ 24/7",
    icon: FiShield,
    badge: "Tăng Uy Tín",
  },
  {
    id: "category-rail",
    name: "Thanh Danh Mục & Story Tròn",
    description: "Bộ lọc danh mục dạng pills, icons hoặc story tròn chuẩn Instagram",
    icon: FiTag,
  },
  {
    id: "flash-sale",
    name: "Flash Sale & Đếm Ngược Giờ Vàng",
    description: "Khối săn deal gấp rút với đồng hồ đếm ngược sinh động",
    icon: FiZap,
    badge: "Hot Deal",
  },
  {
    id: "coupons",
    name: "Kho Mã Giảm Giá & Voucher",
    description: "Các mã voucher ưu đãi độc quyền hấp dẫn khách hàng lưu mã mua sắm",
    icon: FiPercent,
    badge: "Voucher",
  },
  {
    id: "hot-products",
    name: "Top Sản Phẩm Bán Chạy & Trending",
    description: "Khối gợi ý sản phẩm HOT nhất với huy hiệu xếp hạng #1 Best Seller",
    icon: FiZap,
    badge: "Bán Chạy",
  },
  {
    id: "product-feed",
    name: "Lưới Sản Phẩm Chính (Product Grid)",
    description: "Lưới sản phẩm chính đa dạng kích thước, bộ lọc & giỏ hàng nhanh",
    icon: FiShoppingBag,
    badge: "Bắt Buộc",
  },
  {
    id: "editorial",
    name: "Editorial Story & Banner Tạp Chí",
    description: "Khối câu chuyện thương hiệu nghệ thuật với visual ấn tượng",
    icon: FiStar,
  },
  {
    id: "reviews",
    name: "Đánh Giá Khách Hàng (Customer Reviews)",
    description: "Khối carousel phản hồi & đánh giá chân thực từ khách hàng",
    icon: FiGift,
  },
  {
    id: "contact-footer",
    name: "Thông Tin Liên Hệ & Chân Trang Pro",
    description: "Địa chỉ cửa hàng, Hotline, Zalo OA button, Fanpage & Google Map",
    icon: FiMapPin,
    badge: "Chân Trang",
  },
];

interface ShopLiveDragDropCanvasProps {
  data: ShopPersonalizationData;
  onChange: (updated: Partial<ShopPersonalizationData>) => void;
  sellerId?: string;
}

/** Component hỗ trợ gõ chỉnh sửa văn bản trực tiếp inline 100% không cần dialog */
function EditableText({
  value,
  placeholder,
  onChange,
  className = "",
  tag = "h3",
}: {
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  className?: string;
  tag?: "h2" | "h3" | "h4" | "p" | "span";
}) {
  const Tag = tag;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.textContent || "")}
      className={`outline-none transition-all rounded px-1 -mx-1 border border-transparent hover:border-amber-400/60 hover:bg-amber-400/10 focus:border-amber-400 focus:bg-amber-400/20 focus:ring-1 focus:ring-amber-400 cursor-text ${className}`}
      title="Click gõ chữ để sửa text trực tiếp ngay trên UI"
    >
      {value || placeholder}
    </Tag>
  );
}

export default function ShopLiveDragDropCanvas({
  data,
  onChange,
  sellerId,
}: ShopLiveDragDropCanvasProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut Esc to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const currentOrder =
    data.sectionOrder && data.sectionOrder.length > 0
      ? data.sectionOrder
      : STOREFRONT_SECTIONS.map((s) => s.id);

  const currentVisibility = data.sectionVisibility || {
    hero: data.showHero !== false,
    "trust-badges": data.showTrustBadges !== false,
    "category-rail": data.showCategoryRail !== false,
    "flash-sale": data.showFlashSale !== false,
    coupons: true,
    "hot-products": true,
    "product-feed": true,
    editorial: true,
    reviews: data.showReviews !== false,
    "contact-footer": true,
  };

  const blockConfigs: Record<string, ShopBlockConfig> = data.blockConfigs || {};

  const orderedSections = currentOrder
    .map((id) => STOREFRONT_SECTIONS.find((s) => s.id === id))
    .filter(Boolean) as SectionDefinition[];

  STOREFRONT_SECTIONS.forEach((sec) => {
    if (!orderedSections.some((s) => s.id === sec.id)) {
      orderedSections.push(sec);
    }
  });

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedSections.length) return;
    const next = [...orderedSections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const newOrder = next.map((s) => s.id);
    onChange({ sectionOrder: newOrder });
  };

  const handleToggleVisibility = (id: string) => {
    const nextVis = {
      ...currentVisibility,
      [id]: !currentVisibility[id],
    };
    const updates: Partial<ShopPersonalizationData> = {
      sectionVisibility: nextVis,
    };
    if (id === "hero") updates.showHero = nextVis.hero;
    if (id === "trust-badges") updates.showTrustBadges = nextVis["trust-badges"];
    if (id === "category-rail") updates.showCategoryRail = nextVis["category-rail"];
    if (id === "flash-sale") updates.showFlashSale = nextVis["flash-sale"];
    if (id === "reviews") updates.showReviews = nextVis.reviews;
    onChange(updates);
  };

  const handleUpdateBlockConfig = (id: string, updatedConfig: Partial<ShopBlockConfig>) => {
    const current = blockConfigs[id] || {};
    const nextConfigs = {
      ...blockConfigs,
      [id]: {
        ...current,
        ...updatedConfig,
      },
    };
    onChange({ blockConfigs: nextConfigs });
  };

  const handleResetDefault = () => {
    const defaultOrder = STOREFRONT_SECTIONS.map((s) => s.id);
    const defaultVis = {
      hero: true,
      "trust-badges": true,
      "category-rail": true,
      "flash-sale": true,
      coupons: true,
      "hot-products": true,
      "product-feed": true,
      editorial: true,
      reviews: true,
      "contact-footer": true,
    };
    onChange({
      sectionOrder: defaultOrder,
      sectionVisibility: defaultVis,
      blockConfigs: {},
      showHero: true,
      showTrustBadges: true,
      showCategoryRail: true,
      showFlashSale: true,
      showReviews: true,
    });
  };

  const getBlockBgClass = (cfg: ShopBlockConfig) => {
    switch (cfg.bgStyle) {
      case "dark":
        return "bg-stone-900 text-white border-stone-800 shadow-xl";
      case "gradient-amber":
        return "bg-gradient-to-r from-amber-500 via-amber-600 to-rose-500 text-white shadow-lg";
      case "gradient-rose":
        return "bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-lg";
      case "gradient-emerald":
        return "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg";
      case "white":
        return "bg-white text-stone-900 border-stone-200 shadow-sm";
      default:
        return "";
    }
  };

  const renderSectionUI = (sectionId: string) => {
    const cfg = blockConfigs[sectionId] || {};

    switch (sectionId) {
      case "hero":
        return (
          <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${getBlockBgClass(cfg) || "bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900"}`}>
            <div className="max-w-xl space-y-2">
              <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase text-amber-300 border border-amber-400/30">
                ✨ EXCLUSIVE LOOKBOOK 2026
              </span>
              <EditableText
                tag="h2"
                value={cfg.customTitle || data.heroTitle || ""}
                placeholder="Bộ Sưu Tập Sản Phẩm Độc Quyền (Gõ để sửa)"
                onChange={(val) => {
                  handleUpdateBlockConfig("hero", { customTitle: val });
                  onChange({ heroTitle: val });
                }}
                className="text-xl sm:text-2xl font-black leading-snug"
              />
              <EditableText
                tag="p"
                value={cfg.customSubtitle || data.heroSubtitle || ""}
                placeholder="Khám phá các sản phẩm hot nhất — Phong cách dẫn đầu xu hướng mua sắm. (Gõ để sửa)"
                onChange={(val) => {
                  handleUpdateBlockConfig("hero", { customSubtitle: val });
                  onChange({ heroSubtitle: val });
                }}
                className="text-xs text-stone-300"
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-stone-950 shadow-md hover:bg-amber-300 cursor-pointer"
              >
                {data.ctaText || "Săn deal ngay"} →
              </button>
            </div>
          </div>
        );

      case "trust-badges":
        return (
          <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-2xl p-3 shadow-xs border border-stone-200 ${getBlockBgClass(cfg) || "bg-white text-stone-800"}`}>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/80 dark:bg-stone-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <FiTruck size={16} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-tight">Giao hỏa tốc 2H</p>
                <p className="text-[9px] text-stone-500">Nội thành TP.HCM & Hà Nội</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/80 dark:bg-stone-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <FiShield size={16} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-tight">Chính hãng 100%</p>
                <p className="text-[9px] text-stone-500">Cam kết hoàn tiền 200%</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/80 dark:bg-stone-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FiClock size={16} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-tight">7 Ngày đổi trả</p>
                <p className="text-[9px] text-stone-500">Miễn phí thủ tục đổi hàng</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/80 dark:bg-stone-800/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FiPhoneCall size={16} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold leading-tight">Hỗ trợ Zalo 24/7</p>
                <p className="text-[9px] text-stone-500">Tư vấn chọn size chuẩn xác</p>
              </div>
            </div>
          </div>
        );

      case "category-rail":
        return (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-stone-950 shadow-sm shrink-0">
              Tất cả (45)
            </span>
            <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm border border-stone-200 shrink-0">
              Thời trang Unisex
            </span>
            <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm border border-stone-200 shrink-0">
              Giày Sneaker
            </span>
            <span className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm border border-stone-200 shrink-0">
              Phụ kiện cao cấp
            </span>
          </div>
        );

      case "flash-sale":
        return (
          <div className={`overflow-hidden rounded-2xl p-4 text-white shadow-md ${getBlockBgClass(cfg) || "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"}`}>
            <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <EditableText
                  tag="span"
                  value={cfg.customTitle || ""}
                  placeholder="FLASH SALE GIỜ VÀNG (Click để sửa)"
                  onChange={(val) => handleUpdateBlockConfig("flash-sale", { customTitle: val })}
                  className="text-sm font-black uppercase tracking-tight text-white inline-block"
                />
              </div>
              <div className="text-[11px] font-bold bg-black/20 px-2.5 py-0.5 rounded-full">
                02 : 45 : 19
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEMO_PRODUCTS.slice(0, device === "mobile" ? 2 : 4).map((p) => (
                <LayoutProductTile key={p.id} product={p} sellerId="demo" variant="compact" showBadges={true} />
              ))}
            </div>
          </div>
        );

      case "coupons":
        return (
          <div className={`rounded-2xl p-4 border border-amber-400/30 ${getBlockBgClass(cfg) || "bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10"}`}>
            <div className="flex items-center gap-2 mb-3">
              <FiPercent className="text-amber-600" size={16} />
              <EditableText
                tag="h4"
                value={cfg.customTitle || ""}
                placeholder="Kho Mã Giảm Giá Độc Quyền (Click để sửa)"
                onChange={(val) => handleUpdateBlockConfig("coupons", { customTitle: val })}
                className="text-xs font-black text-amber-900 uppercase inline-block"
              />
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-amber-200">
                <div>
                  <p className="text-xs font-black text-rose-600">GIẢM 50.000đ</p>
                  <p className="text-[9px] text-stone-500">Đơn tối thiểu 300K</p>
                </div>
                <button type="button" className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-stone-950 cursor-pointer">Lưu mã</button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-amber-200">
                <div>
                  <p className="text-xs font-black text-blue-600">FREESHIP 0Đ</p>
                  <p className="text-[9px] text-stone-500">Miễn phí toàn quốc</p>
                </div>
                <button type="button" className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-stone-950 cursor-pointer">Lưu mã</button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-2.5 shadow-xs border border-amber-200">
                <div>
                  <p className="text-xs font-black text-emerald-600">GIẢM 10%</p>
                  <p className="text-[9px] text-stone-500">Dành cho bạn mới</p>
                </div>
                <button type="button" className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-stone-950 cursor-pointer">Lưu mã</button>
              </div>
            </div>
          </div>
        );

      case "hot-products":
        return (
          <div className={`space-y-3 rounded-2xl p-4 shadow-sm border border-stone-200 ${getBlockBgClass(cfg) || "bg-white text-stone-900"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-600">
                <FiZap size={16} />
                <EditableText
                  tag="h3"
                  value={cfg.customTitle || ""}
                  placeholder="Top Bán Chạy #1 Best Seller (Click để sửa)"
                  onChange={(val) => handleUpdateBlockConfig("hot-products", { customTitle: val })}
                  className="text-xs font-black uppercase text-stone-900 inline-block"
                />
              </div>
              <span className="text-[11px] font-bold text-amber-600">Xem top 10 🔥</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEMO_PRODUCTS.slice(0, 4).map((p, idx) => (
                <div key={p.id} className="relative">
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-black text-white shadow">
                    #{idx + 1} HOT
                  </span>
                  <LayoutProductTile product={p} sellerId="demo" variant="comfortable" showBadges={true} />
                </div>
              ))}
            </div>
          </div>
        );

      case "product-feed":
        return (
          <div className={`space-y-3 rounded-2xl p-4 border border-stone-200 ${getBlockBgClass(cfg) || "bg-white text-stone-900"}`}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <EditableText
                tag="h3"
                value={cfg.customTitle || ""}
                placeholder="Lưới Sản Phẩm Chính (Product Grid) (Click để sửa)"
                onChange={(val) => handleUpdateBlockConfig("product-feed", { customTitle: val })}
                className="text-sm font-bold text-stone-900 inline-block"
              />
              <span className="text-xs font-semibold text-amber-600">Xem tất cả ({DEMO_PRODUCTS.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DEMO_PRODUCTS.map((p) => (
                <LayoutProductTile key={p.id} product={p} sellerId="demo" variant={data.productCardStyle || "comfortable"} showBadges={true} />
              ))}
            </div>
          </div>
        );

      case "editorial":
        return (
          <div className={`rounded-2xl p-6 shadow-md ${getBlockBgClass(cfg) || "bg-stone-900 text-white"}`}>
            <span className="text-[10px] font-black uppercase text-amber-400">EDITORIAL BRAND STORY</span>
            <EditableText
              tag="h3"
              value={cfg.customTitle || ""}
              placeholder="Nghệ Thuật Trong Mỗi Thiết Kế (Click gõ để sửa)"
              onChange={(val) => handleUpdateBlockConfig("editorial", { customTitle: val })}
              className="mt-1 text-base font-bold text-white block"
            />
            <EditableText
              tag="p"
              value={cfg.customSubtitle || ""}
              placeholder="Trải nghiệm mua sắm chuẩn quốc tế trực tiếp trên Zalo Mini App & Web. (Click gõ để sửa)"
              onChange={(val) => handleUpdateBlockConfig("editorial", { customSubtitle: val })}
              className="mt-1 text-xs text-stone-400 block"
            />
          </div>
        );

      case "reviews":
        return (
          <div className={`rounded-2xl p-4 shadow-sm border border-stone-200 ${getBlockBgClass(cfg) || "bg-white text-stone-900"}`}>
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold mb-2">
              <span>★★★★★</span>
              <EditableText
                tag="span"
                value={cfg.customTitle || ""}
                placeholder="4.9/5 dựa trên 1,280 đánh giá chân thực (Click để sửa)"
                onChange={(val) => handleUpdateBlockConfig("reviews", { customTitle: val })}
                className="text-stone-700 inline-block"
              />
            </div>
            <CustomerReviewsCarousel />
          </div>
        );

      case "contact-footer":
        return (
          <div className={`rounded-2xl p-6 shadow-xl space-y-4 ${getBlockBgClass(cfg) || "bg-stone-950 text-stone-300"}`}>
            <div className="flex flex-wrap justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <EditableText
                  tag="h4"
                  value={cfg.customTitle || ""}
                  placeholder="CỬA HÀNG MUA SẮM CHÍNH HÃNG (Click để sửa)"
                  onChange={(val) => handleUpdateBlockConfig("contact-footer", { customTitle: val })}
                  className="text-sm font-black text-white block"
                />
                <p className="text-xs text-stone-400 mt-1">Số 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer">Zalo OA Chat</button>
                <button type="button" className="rounded-xl bg-stone-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer">Hotline: 1900 6789</button>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-500">
              <span>© 2026 Zalo Storefront Pro. All rights reserved.</span>
              <span>Bảo mật · Điều khoản dịch vụ</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[99999] bg-stone-950/95 p-4 sm:p-6 backdrop-blur-2xl overflow-y-auto min-h-screen flex flex-col text-white"
          : "flex flex-col gap-4"
      }
    >
      {/* Top Controller & Viewport Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 text-base font-black">
            🎨
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              WYSIWYG Live Canvas Builder — Click Gõ Chữ & Tùy Biến Trực Tiếp 100% Trên UI
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click trực tiếp lên Tiêu đề / Mô tả để gõ chữ sửa text. Drag & Drop đổi thứ tự hoặc Click tay nắm ↔ để đổi kích thước!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all shadow-md cursor-pointer ${
              isFullscreen
                ? "bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400"
                : "bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20"
            }`}
            title="Bấm để Phóng to Toàn Màn Hình dễ kéo thả hơn"
          >
            {isFullscreen ? (
              <>
                <FiMinimize2 size={14} /> Thoát Toàn Màn (Esc)
              </>
            ) : (
              <>
                <FiMaximize2 size={14} /> Phóng To Toàn Màn 🖥️
              </>
            )}
          </button>

          {/* Device Switcher */}
          <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                device === "desktop"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              <FiTv size={14} /> Desktop 💻
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                device === "mobile"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              <FiSmartphone size={14} /> Mobile (375px) 📱
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          >
            <FiRotateCcw size={12} /> Đặt lại mặc định
          </button>

          {sellerId ? (
            <Link
              href={`/store/${sellerId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-black text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer"
            >
              <FiExternalLink size={14} /> Xem Preview Data Thật 🚀
            </Link>
          ) : null}
        </div>
      </div>

      {/* Main Interactive Live Canvas Viewport */}
      <div className={`relative flex justify-center rounded-2xl border border-gray-200 bg-gray-100/70 p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-950/60 min-h-[500px] ${isFullscreen ? "flex-1 my-2" : ""}`}>
        <div
          className={`w-full transition-all duration-300 ${
            device === "mobile"
              ? "max-w-[390px] rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden bg-stone-50 dark:bg-stone-950"
              : isFullscreen
              ? "max-w-7xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden bg-stone-50 dark:bg-stone-950"
              : "max-w-5xl rounded-2xl border border-stone-200 shadow-xl overflow-hidden bg-stone-50 dark:bg-stone-950"
          }`}
        >
          {/* Mobile Notch Bar if mobile */}
          {device === "mobile" && (
            <div className="flex h-6 items-center justify-between bg-stone-900 px-6 text-[10px] font-bold text-white">
              <span>9:41</span>
              <div className="h-3 w-16 rounded-full bg-stone-800" />
              <span>5G 🔋</span>
            </div>
          )}

          {/* Canvas Scrollable Content Area with Flex Wrap for Freeform Sizes (100%, 50%, 33%) */}
          <div className="p-4 flex flex-wrap gap-4">
            {orderedSections.map((sec, idx) => {
              const isVisible = currentVisibility[sec.id] !== false;
              const isSelected = selectedBlock === sec.id;
              const cfg = blockConfigs[sec.id] || {};
              const span = cfg.columnSpan || "full";
              const isHalfWidth = span === "half" && device === "desktop";
              const isThirdWidth = span === "third" && device === "desktop";

              const widthClass = isThirdWidth
                ? "w-full lg:w-[calc(33.333%-0.7rem)]"
                : isHalfWidth
                ? "w-full lg:w-[calc(50%-0.5rem)]"
                : "w-full";

              const isDragTarget = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => setDraggedIndex(idx)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(idx);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex !== null && draggedIndex !== idx) {
                      handleMove(draggedIndex, idx);
                    }
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onClick={() => setSelectedBlock(sec.id)}
                  className={`group relative rounded-2xl border transition-all duration-200 ${widthClass} ${
                    draggedIndex === idx
                      ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/40 opacity-60 scale-[0.98]"
                      : isDragTarget
                      ? "border-emerald-500 ring-4 ring-emerald-500/50 shadow-2xl scale-[1.01]"
                      : isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/50 shadow-lg"
                      : "border-transparent hover:border-amber-400/60 hover:shadow-md"
                  } ${!isVisible ? "opacity-40 grayscale" : ""}`}
                >
                  {/* Visual Drop Target Bar */}
                  {isDragTarget && (
                    <div className="absolute -top-2 left-0 right-0 h-1.5 bg-emerald-500 rounded-full shadow-lg animate-pulse z-40" />
                  )}

                  {/* Visual Drag-to-Resize Handle trực tiếp ở góc khối UI */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextSpan = span === "full" ? "half" : span === "half" ? "third" : "full";
                      handleUpdateBlockConfig(sec.id, { columnSpan: nextSpan });
                    }}
                    className="absolute -bottom-2.5 -right-2 z-40 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 px-2.5 py-1 text-[10px] font-black text-stone-950 shadow-xl border border-amber-200 hover:scale-110 active:scale-95 transition-all cursor-ew-resize group-hover:opacity-100"
                    title="Click / Kéo đổi kích thước khối trực tiếp (100% ↔ 50% ↔ 33%)"
                  >
                    <span>↔</span>
                    <span>{span === "third" ? "33% Kích thước" : span === "half" ? "50% Kích thước" : "100% Full Hàng"}</span>
                  </div>

                  {/* Direct Floating Toolbar Bar inside Visual Canvas (Không Cần Dialog Modal) */}
                  <div className="absolute -top-3.5 left-2 right-2 z-30 flex flex-wrap items-center justify-between gap-1.5 rounded-2xl bg-stone-950/95 px-3 py-1.5 text-white shadow-xl backdrop-blur-md transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 cursor-grab items-center justify-center rounded-lg bg-amber-400/20 text-amber-400 active:cursor-grabbing">
                        <FiMove size={12} />
                      </span>
                      <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                        #{idx + 1} {sec.name}
                      </span>
                    </div>

                    {/* Direct Layout Width Pills (100% / 50% / 33%) */}
                    <div className="flex items-center gap-1 bg-stone-800/80 p-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateBlockConfig(sec.id, { columnSpan: "full" });
                        }}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded cursor-pointer transition ${
                          span === "full" ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:text-white"
                        }`}
                        title="Độ rộng 100% toàn hàng"
                      >
                        100%
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateBlockConfig(sec.id, { columnSpan: "half" });
                        }}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded cursor-pointer transition ${
                          span === "half" ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:text-white"
                        }`}
                        title="Độ rộng 50% (Xếp 2 khối chung 1 hàng)"
                      >
                        50%
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateBlockConfig(sec.id, { columnSpan: "third" });
                        }}
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded cursor-pointer transition ${
                          span === "third" ? "bg-amber-400 text-stone-950" : "text-stone-300 hover:text-white"
                        }`}
                        title="Độ rộng 33% (Xếp 3 khối chung 1 hàng)"
                      >
                        33%
                      </button>
                    </div>

                    {/* Direct Color Theme Pills */}
                    <div className="flex items-center gap-1">
                      {[
                        { id: "default", bg: "bg-white", title: "Màu sáng" },
                        { id: "dark", bg: "bg-stone-900 border border-white/40", title: "Dark Obsidian" },
                        { id: "gradient-amber", bg: "bg-amber-500", title: "Amber Gold" },
                        { id: "gradient-rose", bg: "bg-rose-500", title: "Rose Quartz" },
                        { id: "gradient-emerald", bg: "bg-emerald-500", title: "Emerald Pro" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateBlockConfig(sec.id, { bgStyle: c.id as ShopBlockConfig["bgStyle"] });
                          }}
                          className={`h-3.5 w-3.5 rounded-full cursor-pointer transition ${c.bg} ${
                            (cfg.bgStyle || "default") === c.id ? "ring-2 ring-amber-400 scale-125" : "opacity-70 hover:opacity-100"
                          }`}
                          title={c.title}
                        />
                      ))}
                    </div>

                    {/* Move & Visibility Actions */}
                    <div className="flex items-center gap-1 border-l border-white/20 pl-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, idx - 1);
                        }}
                        className="text-stone-300 hover:text-white disabled:opacity-30 text-[10px] px-1 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedSections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, idx + 1);
                        }}
                        className="text-stone-300 hover:text-white disabled:opacity-30 text-[10px] px-1 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(sec.id);
                        }}
                        className="text-stone-300 hover:text-amber-300 text-[11px] px-1 cursor-pointer"
                        title={isVisible ? "Ẩn khối" : "Hiện khối"}
                      >
                        {isVisible ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Render Actual Real Component Content */}
                  <div className="pt-2">
                    {renderSectionUI(sec.id)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
