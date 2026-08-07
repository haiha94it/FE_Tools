"use client";

import type { ShopPersonalizationData } from "@/types/zalo-shop";
import { useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiGrid,
  FiMove,
  FiRotateCcw,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiZap,
} from "react-icons/fi";

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
    description: "Khối banner đầu trang, ảnh bìa bento hoặc video trình diễn sản phẩm",
    icon: FiGrid,
    badge: "Khối Đỉnh Trang",
  },
  {
    id: "category-rail",
    name: "Thanh Danh Mục & Story Tròn",
    description: "Bộ lọc danh mục dạng pills, icons hoặc story tròn phong cách Instagram",
    icon: FiTag,
  },
  {
    id: "flash-sale",
    name: "Flash Sale & Đồng Hồ Đếm Ngược",
    description: "Khối săn deal giới hạn thời gian với đồng hồ đếm ngược gấp rút",
    icon: FiZap,
    badge: "Hot Deal",
  },
  {
    id: "product-feed",
    name: "Lưới Sản Phẩm Chính (Catalog Feed)",
    description: "Lưới sản phẩm chính theo cột, masonry hoặc danh sách phong cách đa dạng",
    icon: FiShoppingBag,
    badge: "Bắt Buộc",
  },
  {
    id: "editorial",
    name: "Editorial Story & Thương Hiệu",
    description: "Khối câu chuyện thương hiệu cao cấp với visual ấn tượng & góc nhìn nghệ thuật",
    icon: FiStar,
  },
  {
    id: "reviews",
    name: "Đánh Giá Khách Hàng (Customer Reviews)",
    description: "Khối carousel phản hồi & đánh giá chân thực từ người mua hàng",
    icon: FiStar,
  },
];

interface ShopSectionDragDropBuilderProps {
  data: ShopPersonalizationData;
  onChange: (updated: Partial<ShopPersonalizationData>) => void;
}

export default function ShopSectionDragDropBuilder({
  data,
  onChange,
}: ShopSectionDragDropBuilderProps) {
  const currentOrder =
    data.sectionOrder && data.sectionOrder.length > 0
      ? data.sectionOrder
      : STOREFRONT_SECTIONS.map((s) => s.id);

  const currentVisibility = data.sectionVisibility || {
    hero: data.showHero !== false,
    "category-rail": data.showCategoryRail !== false,
    "flash-sale": data.showFlashSale !== false,
    "product-feed": true,
    editorial: true,
    reviews: data.showReviews !== false,
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync section list based on order
  const orderedSections = currentOrder
    .map((id) => STOREFRONT_SECTIONS.find((s) => s.id === id))
    .filter(Boolean) as SectionDefinition[];

  // Include any missing sections
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

    onChange({
      sectionOrder: newOrder,
    });
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
    if (id === "category-rail") updates.showCategoryRail = nextVis["category-rail"];
    if (id === "flash-sale") updates.showFlashSale = nextVis["flash-sale"];
    if (id === "reviews") updates.showReviews = nextVis.reviews;

    onChange(updates);
  };

  const handleResetDefault = () => {
    const defaultOrder = STOREFRONT_SECTIONS.map((s) => s.id);
    const defaultVis = {
      hero: true,
      "category-rail": true,
      "flash-sale": true,
      "product-feed": true,
      editorial: true,
      reviews: true,
    };
    onChange({
      sectionOrder: defaultOrder,
      sectionVisibility: defaultVis,
      showHero: true,
      showCategoryRail: true,
      showFlashSale: true,
      showReviews: true,
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-50/30 p-4 dark:border-amber-500/10 dark:bg-amber-950/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3 dark:border-amber-500/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-black">
              🎨
            </span>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Cấu Hình Kéo Thả Thứ Tự Khối UI (Custom Builder)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Kéo thả biểu tượng <FiMove className="inline" /> hoặc dùng mũi tên để đổi thứ tự. Bật/tắt con mắt để ẩn hiện khối trên gian hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        >
          <FiRotateCcw size={12} /> Đặt lại mặc định
        </button>
      </div>

      <div className="space-y-2">
        {orderedSections.map((sec, idx) => {
          const isVisible = currentVisibility[sec.id] !== false;
          const Icon = sec.icon;

          return (
            <div
              key={sec.id}
              draggable
              onDragStart={() => setDraggedIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== idx) {
                  handleMove(draggedIndex, idx);
                  setDraggedIndex(null);
                }
              }}
              className={`group flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                draggedIndex === idx
                  ? "border-amber-500 bg-amber-100/60 dark:bg-amber-900/30 scale-[0.99] opacity-70"
                  : isVisible
                  ? "border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900"
                  : "border-dashed border-gray-200 bg-gray-50/80 opacity-60 dark:border-gray-800 dark:bg-gray-950/40"
              }`}
            >
              {/* Left Drag & Title info */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700 active:cursor-grabbing dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  title="Giữ và kéo thả để di chuyển"
                >
                  <FiMove size={15} />
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-brand-600 dark:bg-gray-800 dark:text-brand-400">
                  <Icon size={18} />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {sec.name}
                    </span>
                    {sec.badge ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        {sec.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {sec.description}
                  </p>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, idx - 1)}
                    className="p-1.5 text-xs text-gray-600 hover:text-brand-600 disabled:opacity-30 dark:text-gray-300 cursor-pointer"
                    title="Di chuyển lên"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === orderedSections.length - 1}
                    onClick={() => handleMove(idx, idx + 1)}
                    className="p-1.5 text-xs text-gray-600 hover:text-brand-600 disabled:opacity-30 dark:text-gray-300 cursor-pointer"
                    title="Di chuyển xuống"
                  >
                    ▼
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleVisibility(sec.id)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                    isVisible
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                  title={isVisible ? "Đang hiện (bấm để ẩn)" : "Đang ẩn (bấm để hiện)"}
                >
                  {isVisible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
