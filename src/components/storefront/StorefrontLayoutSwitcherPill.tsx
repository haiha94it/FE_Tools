"use client";

import type { ShopArchetypeId } from "@/types/zalo-shop";
import { useState } from "react";

interface LayoutOption {
  id: ShopArchetypeId;
  name: string;
  desc: string;
  icon: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: "bento-grid-tech",
    name: "Bento Grid 3D Tech",
    desc: "Khối Bento hiện đại chuẩn Apple, 3D Elevation & Spec Highlight",
    icon: "🍱",
  },
  {
    id: "catalog-first-masonry",
    name: "Lưới Masonry Dynamic",
    desc: "Xếp gạch so le Pinterest style, mượt mà tôn vinh hình ảnh",
    icon: "📌",
  },
  {
    id: "deal-wall-flash",
    name: "Tường Deal Flash Sale",
    desc: "Đồng hồ đếm ngược, badge hot deal, thanh tiến trình bán hàng",
    icon: "⚡",
  },
  {
    id: "split-storyteller",
    name: "Split Storyteller D2C",
    desc: "Chia đôi màn hình kết hợp thương hiệu & sản phẩm nổi bật",
    icon: "📖",
  },
  {
    id: "sidebar-commerce",
    name: "Sidebar Commerce Filter",
    desc: "Cột lọc danh mục cố định bên trái phong cách Amazon / Shopee Pro",
    icon: "🗂️",
  },
  {
    id: "mobile-native",
    name: "Mobile Native Feed",
    desc: "Thanh Story lướt ngang & feed sản phẩm phong cách ứng dụng di động",
    icon: "📱",
  },
  {
    id: "magazine-editorial",
    name: "Magazine Editorial Vogue",
    desc: "Tạp chí thời trang cao cấp với typography lớn & banner tràn viền",
    icon: "📰",
  },
  {
    id: "minimalist-essential",
    name: "Minimalist Luxury",
    desc: "Tối giản sang trọng với hiệu ứng kính mờ Glassmorphism",
    icon: "✨",
  },
];

interface StorefrontLayoutSwitcherPillProps {
  currentArchetype: ShopArchetypeId;
  onSelectArchetype: (id: ShopArchetypeId) => void;
}

export default function StorefrontLayoutSwitcherPill({
  currentArchetype,
  onSelectArchetype,
}: StorefrontLayoutSwitcherPillProps) {
  const [open, setOpen] = useState(false);

  const currentOption =
    LAYOUT_OPTIONS.find((o) => o.id === currentArchetype) || LAYOUT_OPTIONS[0];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Dropdown Menu */}
      {open ? (
        <div className="mb-3 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95 animate-in fade-in-0 zoom-in-95">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 px-1 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              🎨 Chọn Mẫu Giao Diện (8 Layouts Pro)
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {LAYOUT_OPTIONS.map((opt) => {
              const active = opt.id === currentArchetype;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectArchetype(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-200 ${
                    active
                      ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight">{opt.name}</p>
                    <p
                      className={`mt-0.5 text-[10px] line-clamp-1 ${
                        active
                          ? "text-slate-300 dark:text-slate-600"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex cursor-pointer items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900/90 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-black hover:shadow-2xl dark:border-white/20 dark:bg-white/90 dark:text-slate-900"
      >
        <span className="text-base">{currentOption.icon}</span>
        <span>{currentOption.name}</span>
        <span className="ml-1 text-[10px] opacity-70">▼</span>
      </button>
    </div>
  );
}
