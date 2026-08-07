"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreHero from "@/components/storefront/StoreHero";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl } from "@/lib/shop-utils";
import type { ShopBlockConfig } from "@/types/zalo-shop";
import Link from "next/link";
import { useState } from "react";
import {
  FiClock,
  FiMapPin,
  FiPercent,
  FiPhoneCall,
  FiShield,
  FiSliders,
  FiStar,
  FiTruck,
  FiZap,
} from "react-icons/fi";

export default function CustomCanvasLayout({
  sellerId,
  cover,
  categories,
  products,
  filteredProducts,
  config,
  search,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "new">("all");

  const order =
    config.sectionOrder && config.sectionOrder.length > 0
      ? config.sectionOrder
      : [
          "hero",
          "trust-badges",
          "category-rail",
          "flash-sale",
          "coupons",
          "hot-products",
          "product-feed",
          "editorial",
          "reviews",
          "contact-footer",
        ];

  const visibility = config.sectionVisibility || {
    hero: config.showHero !== false,
    "trust-badges": config.showTrustBadges !== false,
    "category-rail": config.showCategoryRail !== false,
    "flash-sale": config.showFlashSale !== false,
    coupons: true,
    "hot-products": true,
    "product-feed": true,
    editorial: true,
    reviews: config.showReviews !== false,
    "contact-footer": true,
  };

  const blockConfigs: Record<string, ShopBlockConfig> = config.blockConfigs || {};

  const displayProducts =
    activeTab === "featured"
      ? filteredProducts.filter(
          (p) => p.is_flash_sale || p.is_hot || Number(p.variants[0]?.price || 0) > 200000
        )
      : activeTab === "new"
      ? [...filteredProducts].reverse()
      : filteredProducts;

  if (loading && !products.length) {
    return <StoreLoading />;
  }

  const getBlockStyle = (cfg: ShopBlockConfig) => {
    if (cfg.bgStyle === "custom" && (cfg.customBgColor || cfg.customTextColor || cfg.customBorderColor)) {
      return {
        backgroundColor: cfg.customBgColor || undefined,
        color: cfg.customTextColor || undefined,
        borderColor: cfg.customBorderColor || undefined,
      };
    }
    return {};
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

  const renderSection = (sectionId: string) => {
    if (visibility[sectionId] === false) return null;
    const cfg = blockConfigs[sectionId] || {};
    const customTitle = cfg.customTitle;
    const customSubtitle = cfg.customSubtitle;
    const span = cfg.columnSpan || "full";

    const widthClass =
      span === "third"
        ? "w-full lg:w-[calc(33.333%-0.7rem)] px-2"
        : span === "half"
        ? "w-full lg:w-[calc(50%-0.5rem)] px-2"
        : "w-full px-2";

    switch (sectionId) {
      case "hero":
        return (
          <div key="hero" className={widthClass}>
            <StoreHero
              sellerId={sellerId}
              cover={cover}
              featuredProducts={products}
              heroTitle={customTitle || config.heroTitle}
              heroSubtitle={customSubtitle || config.heroSubtitle}
              ctaText={config.ctaText}
              showTrustBadges={config.showTrustBadges}
              heroLayout={config.heroLayout}
            />
          </div>
        );

      case "trust-badges":
        if (config.showTrustBadges === false) return null;
        return (
          <div key="trust-badges" className={widthClass}>
            <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl p-4 shadow-sm border border-stone-200/80 dark:border-stone-800 ${getBlockBgClass(cfg) || "bg-white text-stone-800 dark:bg-stone-900 dark:text-stone-200"}`} style={getBlockStyle(cfg)}>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <FiTruck size={18} />
                </div>
                <div>
                  <p className="text-xs font-black leading-tight">Giao Hỏa Tốc 2H</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">Nội thành TP.HCM & Hà Nội</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <FiShield size={18} />
                </div>
                <div>
                  <p className="text-xs font-black leading-tight">Chính Hãng 100%</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">Cam kết hoàn tiền 200%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <FiClock size={18} />
                </div>
                <div>
                  <p className="text-xs font-black leading-tight">7 Ngày Đổi Trả</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">Miễn phí thủ tục đổi hàng</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <FiPhoneCall size={18} />
                </div>
                <div>
                  <p className="text-xs font-black leading-tight">Hỗ Trợ Zalo 24/7</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">Tư vấn chọn size chuẩn xác</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "category-rail":
        if (config.showCategoryRail === false && visibility["category-rail"] === false) return null;
        return (
          <div key="category-rail" className={widthClass}>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Link
                href={buildStoreUrl(sellerId)}
                className="shrink-0 rounded-full bg-amber-400 text-stone-950 shadow-amber-400/20 px-4 py-2 text-xs font-bold transition-all shadow-sm"
              >
                Tất cả sản phẩm ({products.length})
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildStoreCategoryUrl(sellerId, cat.id)}
                  className="shrink-0 rounded-full bg-white/80 text-stone-700 hover:bg-amber-100 dark:bg-stone-800 dark:text-stone-300 px-4 py-2 text-xs font-bold transition-all shadow-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        );

      case "flash-sale":
        if (!config.showFlashSale) return null;
        const flashItems = products.filter((p) => p.is_flash_sale || p.is_hot).slice(0, 8);
        const displayFlash = flashItems.length > 0 ? flashItems : products.slice(0, 6);

        return (
          <div key="flash-sale" className={widthClass}>
            <div className={`overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-lg ${getBlockBgClass(cfg) || "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600"}`} style={getBlockStyle(cfg)}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-sm">⚡</span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                    {customTitle || "FLASH SALE GIỜ VÀNG"}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
                  <span>Kết thúc sau:</span>
                  <span className="bg-white text-stone-900 px-1.5 py-0.5 rounded font-black">02</span>:
                  <span className="bg-white text-stone-900 px-1.5 py-0.5 rounded font-black">45</span>:
                  <span className="bg-white text-stone-900 px-1.5 py-0.5 rounded font-black">19</span>
                </div>
              </div>

              <div className={`mt-4 grid grid-cols-2 gap-3 ${span === "third" ? "sm:grid-cols-1 md:grid-cols-2" : span === "half" ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"}`}>
                {displayFlash.map((prod) => (
                  <LayoutProductTile
                    key={prod.id}
                    product={prod}
                    sellerId={sellerId}
                    variant="comfortable"
                    showBadges={true}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "coupons":
        return (
          <div key="coupons" className={widthClass}>
            <div className={`rounded-3xl p-5 border border-amber-400/30 ${getBlockBgClass(cfg) || "bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 dark:bg-amber-950/20"}`} style={getBlockStyle(cfg)}>
              <div className="flex items-center gap-2 mb-3">
                <FiPercent className="text-amber-600 dark:text-amber-400" size={18} />
                <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-tight">{customTitle || "Kho Mã Giảm Giá Độc Quyền"}</h4>
              </div>
              <div className={`grid grid-cols-1 gap-3 ${span === "third" ? "sm:grid-cols-1" : span === "half" ? "sm:grid-cols-1 md:grid-cols-2" : "sm:grid-cols-3"}`}>
                <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-xs border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                  <div>
                    <p className="text-sm font-black text-rose-600">GIẢM 50.000đ</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">Đơn tối thiểu 300K</p>
                  </div>
                  <button type="button" className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-sm cursor-pointer">Lưu mã</button>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-xs border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                  <div>
                    <p className="text-sm font-black text-blue-600">FREESHIP 0Đ</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">Miễn phí giao toàn quốc</p>
                  </div>
                  <button type="button" className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-sm cursor-pointer">Lưu mã</button>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-xs border border-amber-200 dark:bg-stone-900 dark:border-stone-800">
                  <div>
                    <p className="text-sm font-black text-emerald-600">GIẢM 10%</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">Dành riêng khách hàng mới</p>
                  </div>
                  <button type="button" className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-sm cursor-pointer">Lưu mã</button>
                </div>
              </div>
            </div>
          </div>
        );

      case "hot-products":
        const hotList = products.filter((p) => p.is_hot || p.is_flash_sale).slice(0, 4);
        const displayHot = hotList.length > 0 ? hotList : products.slice(0, 4);

        return (
          <div key="hot-products" className={widthClass}>
            <div className={`space-y-4 rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800 ${getBlockBgClass(cfg) || "bg-white text-stone-900 dark:bg-stone-900 dark:text-white"}`} style={getBlockStyle(cfg)}>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-stone-800">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <FiZap size={20} />
                  <h3 className="text-base font-black uppercase">{customTitle || "Top Bán Chạy #1 Best Seller"}</h3>
                </div>
                <span className="text-xs font-bold text-amber-600 hover:underline cursor-pointer">Xem tất cả 🔥</span>
              </div>
              <div className={`grid grid-cols-2 gap-4 ${span === "third" ? "sm:grid-cols-1" : span === "half" ? "sm:grid-cols-2" : "sm:grid-cols-4"}`}>
                {displayHot.map((p, idx) => (
                  <div key={p.id} className="relative">
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                      #{idx + 1} HOT
                    </span>
                    <LayoutProductTile product={p} sellerId={sellerId} variant="comfortable" showBadges={true} onQuickView={onQuickView} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "product-feed":
        return (
          <div key="product-feed" className={widthClass}>
            {/* Header Feed Controller */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4 dark:border-stone-800">
              <div>
                <div className="flex items-center gap-2">
                  <FiStar className="text-amber-500" />
                  <h2 className="text-lg font-black tracking-tight">
                    {customTitle || "Bộ Sưu Tập Sản Phẩm"}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  {search
                    ? `Kết quả tìm kiếm cho "${search}" (${displayProducts.length} sản phẩm)`
                    : customSubtitle || `Hiển thị ${displayProducts.length} sản phẩm tuyển chọn`}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-xl bg-stone-200/60 p-1 dark:bg-stone-800/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-white text-stone-950 shadow-sm dark:bg-stone-900 dark:text-white"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("featured")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === "featured"
                      ? "bg-white text-stone-950 shadow-sm dark:bg-stone-900 dark:text-white"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                  }`}
                >
                  🔥 Nổi bật
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === "new"
                      ? "bg-white text-stone-950 shadow-sm dark:bg-stone-900 dark:text-white"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400"
                  }`}
                >
                  ✨ Mới nhất
                </button>
              </div>
            </div>

            {/* Product Feed Grid */}
            {displayProducts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800">
                  <FiSliders size={24} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-stone-700 dark:text-stone-300">
                  Chưa có sản phẩm phù hợp
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Thử tìm kiếm từ khóa khác hoặc chọn lại danh mục sản phẩm.
                </p>
              </div>
            ) : (
              <div className={`mt-6 grid grid-cols-2 gap-3 sm:gap-5 ${span === "third" ? "sm:grid-cols-1" : span === "half" ? "sm:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-4"}`}>
                {displayProducts.map((product) => (
                  <LayoutProductTile
                    key={product.id}
                    product={product}
                    sellerId={sellerId}
                    variant={config.productCardStyle || "comfortable"}
                    showBadges={config.showHotBadge || config.showFlashBadge}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case "editorial":
        return (
          <div key="editorial" className={widthClass}>
            <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-10 border border-stone-800 ${getBlockBgClass(cfg) || "bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950"}`} style={getBlockStyle(cfg)}>
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-400/30">
                  ✨ CUSTOM BUILDER CANVASES 2026
                </span>
                <h3 className="mt-3 text-xl sm:text-3xl font-black text-white leading-tight">
                  {customTitle || "Tự Do Sáng Tạo Giao Diện Theo Cách Của Bạn"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
                  {customSubtitle || "Thiết kế linh hoạt, tối ưu chuyển đổi di động và mang lại trải nghiệm mua sắm đẳng cấp nhất cho khách hàng trên Zalo & Web."}
                </p>
              </div>
            </div>
          </div>
        );

      case "reviews":
        if (config.showReviews === false) return null;
        return (
          <div key="reviews" className={widthClass}>
            <CustomerReviewsCarousel />
          </div>
        );

      case "contact-footer":
        return (
          <div key="contact-footer" className={widthClass}>
            <div className={`rounded-3xl p-6 shadow-xl space-y-4 border border-stone-800 ${getBlockBgClass(cfg) || "bg-stone-950 text-stone-300"}`} style={getBlockStyle(cfg)}>
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-stone-800 pb-4">
                <div>
                  <h4 className="text-sm font-black text-white">{customTitle || "CỬA HÀNG MUA SẮM CHÍNH HÃNG"}</h4>
                  <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                    <FiMapPin className="text-amber-400" />
                    {config.contactAddress || "Số 123 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {config.contactZalo ? (
                    <a href={`https://zalo.me/${config.contactZalo}`} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500">Zalo OA Chat</a>
                  ) : (
                    <button type="button" className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm">Zalo OA Chat</button>
                  )}
                  {config.contactPhone ? (
                    <a href={`tel:${config.contactPhone}`} className="rounded-xl bg-stone-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-stone-700">Hotline: {config.contactPhone}</a>
                  ) : (
                    <button type="button" className="rounded-xl bg-stone-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm">Hotline: 1900 6789</button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-between items-center text-[11px] text-stone-500 gap-2">
                <span>© 2026 Zalo Storefront Canvas. All rights reserved.</span>
                <span>Bảo mật · Điều khoản dịch vụ · Chính sách bảo hành</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16 pt-4">
      <div className="mx-auto max-w-7xl flex flex-wrap gap-y-4">
        {order.map((secId) => renderSection(secId))}
      </div>
    </div>
  );
}
