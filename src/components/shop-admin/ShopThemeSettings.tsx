"use client";

import { ProLayoutBuilder } from "@/components/shop-admin/layout-canvas";
import CustomSelect from "@/components/form/CustomSelect";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  DEFAULT_SHOP_PERSONALIZATION,
  resolveArchetypeId,
  resolvePersonalization,
  SHOP_TEMPLATE_PRESETS,
  type ShopTemplatePreset,
} from "@/lib/shop-personalization";
import {
  buildPublicStorefrontAbsoluteUrl,
  shopImageUrl,
} from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import {
  PDP_TEMPLATE_PRESETS,
  type PDPTemplateType,
} from "@/types/pdp-template";
import type {
  ShopArchetypeId,
  ShopCategory,
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
} from "@/types/zalo-shop";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCheckCircle,
  HiOutlinePaintBrush,
  HiOutlinePhone,
  HiOutlineSparkles,
} from "react-icons/hi2";

type TabId = "templates" | "builder" | "pdp" | "colors" | "content";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "templates", label: "Kiến trúc layout", short: "Kiến trúc" },
  { id: "builder", label: "Trình tạo trang", short: "Builder" },
  { id: "pdp", label: "Trang chi tiết SP", short: "PDP" },
  { id: "colors", label: "Màu sắc", short: "Màu" },
  { id: "content", label: "Nội dung", short: "Nội dung" },
];

const THEME_MODE_OPTIONS = [
  { value: "light", label: "Chế độ Sáng (Light)" },
  { value: "dark", label: "Chế độ Tối (Dark)" },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "Tất cả kiến trúc" },
  { id: "brand", label: "Thương hiệu & Tự tạo giao diện" },
  { id: "tech", label: "Công nghệ & Bento Grid" },
  { id: "marketplace", label: "Sàn TMĐT & Sale Giờ Vàng" },
  { id: "fashion", label: "Thời trang & Bộ sưu tập" },
  { id: "utility", label: "Ứng dụng & Thanh điều hướng" },
  { id: "mobile", label: "Giao diện App Di Động" },
  { id: "editorial", label: "Tạp chí Phong cách" },
  { id: "minimal", label: "Tối giản Tinh tế" },
];

function WireframeHeaderBar({ title = "CỬA HÀNG ONLINE" }: { title?: string }) {
  return (
    <div className="flex h-5 w-full shrink-0 items-center justify-between border-b border-black/5 bg-white/80 px-2 backdrop-blur-xs dark:border-white/10 dark:bg-gray-900/80">
      <div className="flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-red-400" />
        <span className="size-1.5 rounded-full bg-amber-400" />
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </div>
      <span className="font-mono text-[8px] font-bold tracking-wider text-gray-400 dark:text-gray-500">
        {title}
      </span>
      <div className="size-2 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

/** Wireframe silhouettes — sleek miniature UI mockups per archetype */
function ArchetypeWireframe({
  id,
  colors,
}: {
  id: ShopArchetypeId;
  colors: ShopTemplatePreset["preview"];
}) {
  const { bg, surface, primary, accent } = colors;

  switch (id) {
    case "custom-drag-drop":
      return (
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-3.5 text-white">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-purple-500/10 blur-xl" />
          <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-amber-500/10 blur-xl" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 backdrop-blur-xs">
              <HiOutlineSparkles size={10} /> THIẾT KẾ
            </span>
            <span className="text-[9px] font-bold text-slate-400">Tùy biến 100%</span>
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center text-center">
            <span className="mb-1.5 flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-300 shadow-inner backdrop-blur-md">
              <HiOutlinePaintBrush size={18} />
            </span>
            <span className="text-xs font-black tracking-wide text-white">
              Kéo Thả Trực Quan
            </span>
            <span className="mt-0.5 text-[10px] text-slate-300">
              Kéo thả &amp; sắp xếp các khối giao diện theo ý muốn
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1 text-[9px] font-bold text-amber-200">
            <span>Khối Banner</span> • <span>Sale Giờ Vàng</span> • <span>Lưới SP</span>
          </div>
        </div>
      );

    case "bento-grid-tech":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="CÔNG NGHỆ BENTO" />
          <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-1 p-1.5">
            <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-lg p-1.5 shadow-xs" style={{ background: primary }}>
              <div className="size-2 rounded-full" style={{ background: accent }} />
              <div className="space-y-0.5">
                <div className="h-1.5 w-10 rounded-xs bg-white/70" />
                <div className="h-1 w-6 rounded-xs bg-white/40" />
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg p-1 shadow-xs" style={{ background: surface }}>
              <div className="space-y-0.5">
                <div className="h-1.5 w-8 rounded-xs" style={{ background: primary }} />
                <div className="h-1 w-5 rounded-xs" style={{ background: accent }} />
              </div>
              <div className="size-3 rounded-full opacity-80" style={{ background: accent }} />
            </div>
            <div className="rounded-lg p-1 shadow-xs" style={{ background: surface }}>
              <div className="h-1 w-full rounded-xs" style={{ background: primary }} />
            </div>
            <div className="rounded-lg p-1 shadow-xs" style={{ background: accent }}>
              <div className="h-1 w-full rounded-xs bg-white/80" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col justify-between rounded-md p-1 shadow-2xs" style={{ background: surface }}>
                <div className="h-2.5 w-full rounded-xs opacity-20" style={{ background: primary }} />
                <div className="h-1 w-3/4 rounded-xs" style={{ background: primary }} />
              </div>
            ))}
          </div>
        </div>
      );

    case "deal-wall-flash":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="SALE GIỜ VÀNG" />
          <div className="flex h-3.5 w-full shrink-0 items-center justify-between px-2 text-[7px] font-black text-white" style={{ background: primary }}>
            <span>⚡ SALE GIỜ VÀNG (FLASH SALE)</span>
            <span className="rounded bg-black/20 px-1 font-mono">02:15:40</span>
          </div>
          <div className="grid flex-1 grid-cols-5 gap-1 p-1.5">
            <div className="col-span-3 flex flex-col justify-between rounded-lg p-1.5 shadow-xs" style={{ background: surface }}>
              <div className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ background: accent }} />
                <div className="h-1.5 w-12 rounded-xs" style={{ background: primary }} />
              </div>
              <div className="h-4 w-full rounded-md opacity-15" style={{ background: primary }} />
              <div className="h-2 w-10 rounded-full" style={{ background: accent }} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex flex-1 flex-col justify-between rounded-lg p-1 shadow-xs" style={{ background: primary }}>
                <div className="h-1.5 w-8 rounded-xs bg-white/90" />
                <div className="h-2 w-6 rounded-full bg-white/30" />
              </div>
              <div className="flex flex-1 flex-col justify-between rounded-lg p-1 shadow-xs" style={{ background: surface }}>
                <div className="h-1.5 w-8 rounded-xs" style={{ background: accent }} />
                <div className="h-1 w-5 rounded-xs" style={{ background: primary }} />
              </div>
            </div>
          </div>
          <div className="grid h-6 shrink-0 grid-cols-5 gap-1 border-t border-black/5 bg-white/50 px-1.5 py-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-full rounded-xs shadow-2xs" style={{ background: surface }} />
            ))}
          </div>
        </div>
      );

    case "catalog-first-masonry":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="BỘ SƯU TẬP MASONRY" />
          <div className="flex h-6 shrink-0 items-center justify-around border-b border-black/5 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="size-3.5 rounded-full border border-black/10 p-0.5"
                style={{ borderColor: i === 1 ? primary : "transparent" }}
              >
                <div className="h-full w-full rounded-full" style={{ background: i === 1 ? primary : surface }} />
              </div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1 p-1.5">
            <div className="flex flex-col gap-1">
              <div className="h-14 rounded-lg shadow-xs" style={{ background: primary }} />
              <div className="flex-1 rounded-lg shadow-xs" style={{ background: surface }} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-8 rounded-lg shadow-xs" style={{ background: surface }} />
              <div className="flex-1 rounded-lg shadow-xs" style={{ background: accent }} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-12 rounded-lg shadow-xs" style={{ background: surface }} />
              <div className="flex-1 rounded-lg shadow-xs" style={{ background: primary }} />
            </div>
          </div>
        </div>
      );

    case "split-storyteller":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="THƯƠNG HIỆU CAO CẤP" />
          <div className="relative flex h-20 w-full flex-col items-center justify-center p-2 text-center text-white" style={{ background: primary }}>
            <div className="h-1.5 w-16 rounded-xs bg-white/90" />
            <div className="mt-1 h-1 w-24 rounded-xs bg-white/50" />
            <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[7px] font-bold text-white shadow-xs" style={{ background: accent }}>
              <span>KHÁM PHÁ</span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1 p-1.5">
            <div className="flex flex-col justify-between rounded-lg p-1.5 shadow-xs" style={{ background: surface }}>
              <div className="h-2 w-10 rounded-xs" style={{ background: primary }} />
              <div className="h-8 w-full rounded-md opacity-20" style={{ background: primary }} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-md shadow-2xs" style={{ background: surface }} />
              ))}
            </div>
          </div>
        </div>
      );

    case "sidebar-commerce":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="THANH ĐIỀU HƯỚNG B2B" />
          <div className="grid flex-1 grid-cols-[28%_1fr] gap-1 p-1">
            <div className="flex flex-col gap-1 rounded-md p-1 shadow-xs" style={{ background: surface }}>
              <div className="h-2 w-full rounded-xs" style={{ background: primary }} />
              <div className="h-1.5 w-3/4 rounded-xs bg-gray-200 dark:bg-gray-700" />
              <div className="h-1.5 w-full rounded-xs bg-gray-200 dark:bg-gray-700" />
              <div className="h-1.5 w-2/3 rounded-xs bg-gray-200 dark:bg-gray-700" />
              <div className="mt-auto h-2 w-full rounded-xs" style={{ background: accent }} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-3 w-full rounded-md shadow-2xs" style={{ background: surface }} />
              <div className="grid flex-1 grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col justify-between rounded-md p-1 shadow-2xs" style={{ background: surface }}>
                    <div className="h-3 w-full rounded-xs opacity-20" style={{ background: primary }} />
                    <div className="h-1 w-full rounded-xs" style={{ background: primary }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case "mobile-native":
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-1.5" style={{ background: bg }}>
          <div className="flex h-full w-[125px] flex-col overflow-hidden rounded-xl border-2 border-gray-800 bg-white shadow-md dark:bg-gray-900">
            <div className="flex h-2.5 w-full items-center justify-between bg-black px-1.5 text-[6px] text-white">
              <span>9:41</span>
              <div className="h-1 w-3 rounded-full bg-white/40" />
            </div>
            <div className="flex h-3.5 w-full items-center justify-between px-1.5" style={{ background: primary }}>
              <div className="h-1.5 w-8 rounded-xs bg-white" />
              <div className="size-2 rounded-full" style={{ background: accent }} />
            </div>
            <div className="flex h-10 w-full items-center justify-center bg-gray-800 text-[7px] text-white">
              <span className="rounded bg-pink-500 px-1 py-0.5 font-bold">VIDEO MÔ TẢ</span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-1 p-1">
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col justify-between rounded p-1 shadow-2xs bg-gray-100 dark:bg-gray-800">
                  <div className="h-3 w-full rounded-xs bg-gray-300 dark:bg-gray-700" />
                  <div className="h-1 w-full rounded-xs" style={{ background: primary }} />
                </div>
              ))}
            </div>
            <div className="flex h-3 w-full items-center justify-around border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="size-1.5 rounded-full" style={{ background: i === 1 ? accent : "#9CA3AF" }} />
              ))}
            </div>
          </div>
        </div>
      );

    case "magazine-editorial":
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="TẠP CHÍ PHONG CÁCH" />
          <div className="flex h-12 w-full flex-col items-center justify-center p-1 text-center" style={{ background: surface }}>
            <div className="h-2 w-20 rounded-xs" style={{ background: primary }} />
            <div className="mt-1 h-1 w-28 rounded-xs bg-gray-400" />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1.5 p-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-1 rounded-md p-1 shadow-2xs" style={{ background: surface }}>
                <div className="h-10 w-full rounded-xs opacity-30" style={{ background: primary }} />
                <div className="h-1.5 w-full rounded-xs" style={{ background: primary }} />
                <div className="h-1 w-2/3 rounded-xs" style={{ background: accent }} />
              </div>
            ))}
          </div>
        </div>
      );

    case "minimalist-essential":
    default:
      return (
        <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: bg }}>
          <WireframeHeaderBar title="TỐI GIẢN CHUẨN MUJI" />
          <div className="flex h-14 w-full flex-col items-center justify-center border-b border-black/5 p-2 text-center">
            <div className="size-6 rounded-full border border-black/20 bg-gray-100 dark:bg-gray-800" />
            <div className="mt-1 h-1.5 w-14 rounded-xs" style={{ background: primary }} />
          </div>
          <div className="grid flex-1 grid-cols-3 divide-x divide-black/5 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center justify-center p-1">
                <div className="size-5 rounded-md bg-gray-100 dark:bg-gray-800" />
                <div className="mt-1 h-1 w-6 rounded-xs" style={{ background: primary }} />
              </div>
            ))}
          </div>
        </div>
      );
  }
}

function PDPWireframe({ id }: { id: PDPTemplateType }) {
  if (id === "dense-deal") {
    return (
      <div className="flex h-full flex-col gap-0.5 p-1.5">
        <div className="h-2 rounded bg-orange-500" />
        <div className="grid flex-1 grid-cols-2 gap-0.5">
          <div className="rounded bg-slate-300" />
          <div className="flex flex-col gap-0.5">
            <div className="h-2 rounded bg-rose-400" />
            <div className="flex-1 rounded bg-white" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "editorial-story") {
    return (
      <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-0.5 p-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex-1 rounded bg-slate-700" />
          <div className="flex-1 rounded bg-slate-500" />
        </div>
        <div className="rounded bg-white shadow-sm" />
      </div>
    );
  }
  if (id === "minimal-gallery") {
    return (
      <div className="flex h-full flex-col gap-0.5 p-1.5">
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-0.5">
          <div className="rounded bg-slate-200" />
          <div className="rounded bg-slate-300" />
          <div className="rounded bg-slate-300" />
          <div className="rounded bg-slate-200" />
        </div>
        <div className="h-3 rounded bg-white" />
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-0.5 p-1.5">
      <div className="flex gap-0.5">
        <div className="w-2 rounded bg-slate-200" />
        <div className="flex-1 rounded bg-slate-300" />
      </div>
      <div className="rounded bg-white shadow-sm" />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>
    </label>
  );
}

function ThemePreview({ data }: { data: Required<ShopPersonalizationData> }) {
  const archetype = resolveArchetypeId(data.templateId);
  const preset = SHOP_TEMPLATE_PRESETS.find((p) => p.id === archetype);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-700 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
        <p className="text-xs font-bold text-gray-900 dark:text-white">
          {preset?.name ?? archetype}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-500">{preset?.inspiredBy}</p>
      </div>
      <div className="h-40 sm:h-44">
        <ArchetypeWireframe
          id={archetype}
          colors={{
            bg: data.backgroundColor,
            surface: data.surfaceColor,
            primary: data.primaryColor,
            accent: data.accentColor,
          }}
        />
      </div>
      <div className="space-y-1.5 border-t border-gray-100 px-3 py-2.5 text-[11px] text-gray-500 dark:border-gray-800">
        <p>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Layout:
          </span>{" "}
          {preset?.pageLayoutLabel}
        </p>
        <p className="line-clamp-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Tags:
          </span>{" "}
          {preset?.tags.join(" · ")}
        </p>
        <p className="line-clamp-2 italic leading-relaxed">{preset?.philosophy}</p>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      )}
    </label>
  );
}

export default function ShopThemeSettings() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";
  const domain = useZaloShopAdminStore((s) => s.domain);
  const loadDomain = useZaloShopAdminStore((s) => s.loadDomain);

  const [tab, setTab] = useState<TabId>("templates");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [builderTargetPage, setBuilderTargetPage] = useState<"home" | "pdp">("home");
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ShopPersonalizationData>({
    ...DEFAULT_SHOP_PERSONALIZATION,
  });
  const [dirty, setDirty] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [shopCover, setShopCover] = useState<ShopCover | null>(null);
  const [shopDataLoading, setShopDataLoading] = useState(false);

  const resolved = useMemo(() => resolvePersonalization(draft), [draft]);
  const archetype = resolveArchetypeId(resolved.templateId);
  const isBuilder = tab === "builder";

  const canvasTheme = useMemo(
    () => ({
      primaryColor: resolved.primaryColor,
      accentColor: resolved.accentColor,
      backgroundColor: resolved.backgroundColor,
      shopName: shopCover?.name?.trim() || "Cửa hàng",
      logoUrl: shopImageUrl(shopCover?.image_logo) || undefined,
      coverImageUrl: shopImageUrl(shopCover?.image) || undefined,
      contactPhone: resolved.contactPhone,
      contactZalo: resolved.contactZalo,
      contactFacebook: resolved.contactFacebook,
      contactWebsite: resolved.contactWebsite,
      contactAddress: resolved.contactAddress,
      heroTitle: resolved.heroTitle,
      heroSubtitle: resolved.heroSubtitle,
      ctaText: resolved.ctaText,
      announcement: resolved.announcement,
    }),
    [resolved, shopCover],
  );

  const patch = useCallback((partial: Partial<ShopPersonalizationData>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const record = await zaloShopService.getPersonalization();
          if (cancelled) return;
          setRecordId(record.id);
          setDraft(
            resolvePersonalization(record.data as ShopPersonalizationData),
          );
          setDirty(false);
        } catch {
          if (!cancelled) {
            toast.error("Không tải được cấu hình theme");
            setDraft({ ...DEFAULT_SHOP_PERSONALIZATION });
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!userId) {
        setShopProducts([]);
        setShopCategories([]);
        setShopCover(null);
        setShopDataLoading(false);
        return;
      }
      void (async () => {
        setShopDataLoading(true);
        try {
          const [productsRes, categories, cover] = await Promise.all([
            zaloShopService.listProducts({
              employeeId: userId,
              pageSize: 100,
            }),
            zaloShopService.listCategories(userId),
            zaloShopService.getCover(userId),
          ]);
          if (cancelled) return;
          setShopProducts(productsRes.results ?? []);
          setShopCategories(categories ?? []);
          setShopCover(cover ?? null);
        } catch {
          if (!cancelled) {
            setShopProducts([]);
            setShopCategories([]);
            setShopCover(null);
          }
        } finally {
          if (!cancelled) setShopDataLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId]);

  const handleSelectTemplate = (presetId: ShopArchetypeId) => {
    const preset = SHOP_TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      ...preset.data,
      templateId: presetId,
    }));
    setDirty(true);
    if (presetId === "custom-drag-drop") {
      setTab("builder");
    }
    toast.success(`Đã chọn mẫu: ${preset.name}`);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const isCustom =
        resolveArchetypeId(draft.templateId) === "custom-drag-drop" ||
        draft.pageLayout === "custom-builder" ||
        archetype === "custom-drag-drop";

      const payload: ShopPersonalizationData = {
        ...draft,
        templateId: isCustom ? "custom-drag-drop" : archetype,
        pageLayout: isCustom ? "custom-builder" : draft.pageLayout,
      };
      const res = await zaloShopService.savePersonalization(payload);
      if (res.id != null) setRecordId(res.id);
      if (res.data) {
        setDraft(resolvePersonalization(res.data as ShopPersonalizationData));
      } else {
        setDraft((prev) => resolvePersonalization({ ...prev, ...payload }));
      }
      setDirty(false);
      toast.success(
        isCustom
          ? "Đã lưu layout canvas — mở gian hàng để xem giống builder"
          : "Đã lưu cấu hình giao diện thành công!",
      );
    } catch {
      toast.error("Lưu cấu hình giao diện thất bại");
    } finally {
      setSaving(false);
    }
  }, [draft, archetype]);

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    const onSave = () => {
      void handleSaveRef.current();
    };
    window.addEventListener("layout-builder-save", onSave);
    return () => window.removeEventListener("layout-builder-save", onSave);
  }, []);

  const handleReset = async () => {
    if (
      !window.confirm(
        "Khôi phục cấu hình về mẫu Bento Grid Công Nghệ mặc định?",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await zaloShopService.deletePersonalization();
      setRecordId(null);
      setDraft({ ...DEFAULT_SHOP_PERSONALIZATION });
      setDirty(false);
      toast.success("Đã đặt lại cấu hình mặc định!");
    } catch {
      toast.error("Không thể đặt lại giao diện");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (domain === null) void loadDomain();
  }, [domain, loadDomain]);

  const storeHref = userId
    ? buildPublicStorefrontAbsoluteUrl(userId, domain)
    : null;

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {storeHref ? (
        <Link
          href={storeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
        >
          <HiOutlineArrowTopRightOnSquare size={14} aria-hidden />
          Xem gian hàng
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={saving || loading}
        className="min-h-10 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        Đặt lại
      </button>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving || loading}
        className={`min-h-10 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold text-white shadow-theme-xs transition duration-150 disabled:opacity-50 ${
          dirty
            ? "bg-brand-500 ring-2 ring-brand-500/35 hover:bg-brand-600"
            : "bg-brand-500 hover:bg-brand-600"
        }`}
      >
        {saving ? "Đang lưu…" : dirty ? "Lưu thay đổi *" : "Lưu thay đổi"}
      </button>
    </div>
  );

  const tabBar = (
    <div
      className="flex gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-gray-200/80 bg-gray-100/90 p-1.5 no-scrollbar dark:border-gray-700/60 dark:bg-gray-800/90"
      role="tablist"
      aria-label="Tab cấu hình theme"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setTab(t.id)}
            className={`min-h-10 shrink-0 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition duration-150 sm:px-3.5 ${
              active
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:bg-white/60 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200"
            }`}
          >
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );

  /* ── Builder: full-height shell (canvas cần height cố định) ── */
  if (isBuilder) {
    return (
      <div className="flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:-m-6 md:h-[calc(100%+3rem)] md:w-[calc(100%+3rem)] md:max-w-none">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-900">
          <div className="flex shrink-0 flex-col gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between md:px-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 dark:text-white">
                  Trình tạo trang gian hàng
                </h1>
                {dirty ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    Chưa lưu
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                Kéo thả section · chỉnh thuộc tính · xem preview
                {storeHref ? (
                  <>
                    {" · "}
                    <Link
                      href={storeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      /store/{userId}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            {actionButtons}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/90 px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900/80">
            {tabBar}
            {/* Page Target Selector: Trang Chủ vs Trang Chi Tiết SP */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-200/80 p-1 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setBuilderTargetPage("home")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  builderTargetPage === "home"
                    ? "bg-white text-brand-600 shadow-xs dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                🏠 Trang chủ Cửa hàng
              </button>
              <button
                type="button"
                onClick={() => setBuilderTargetPage("pdp")}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  builderTargetPage === "pdp"
                    ? "bg-white text-purple-600 shadow-xs dark:bg-gray-900 dark:text-purple-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                📦 Trang Chi tiết Sản phẩm (PDP)
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-3">
                <span className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="text-sm text-gray-500">Đang tải…</p>
              </div>
            ) : (
              <ProLayoutBuilder
                userId={userId}
                sellerId={userId}
                draft={resolved}
                onDraftChange={patch}
                products={shopProducts}
                categories={shopCategories}
                theme={canvasTheme}
                dataLoading={shopDataLoading}
                onDirty={() => setDirty(true)}
                targetPage={builderTargetPage}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col overflow-hidden">
      <div className="shrink-0 pb-2">
        <PageBreadcrumb
          pageTitle="Theme cửa hàng"
          showPageTitle={false}
          className="!mb-0"
          parents={[{ label: "Gian hàng", href: "/shop" }]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Fixed Header & Tab Bar */}
        <div className="shrink-0 rounded-t-2xl border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Header */}
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                  Cấu hình theme gian hàng
                </h1>
                {dirty ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    Chưa lưu
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Chọn kiến trúc layout, màu sắc và nội dung storefront
                {storeHref ? (
                  <>
                    {" · "}
                    <Link
                      href={storeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      /store/{userId}
                    </Link>
                  </>
                ) : null}
                {recordId != null ? ` · #${recordId}` : null}
              </p>
            </div>
            {actionButtons}
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-100 px-3 py-2.5 dark:border-gray-800 sm:px-4">
            {tabBar}
          </div>
        </div>

        {/* Scrollable Content Body ONLY */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <span className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-gray-500">Đang tải cấu hình theme…</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Main content area — ONLY this area scrolls */}
            <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {tab === "templates" ? (
                <div className="space-y-6">

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {CATEGORY_FILTERS.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition duration-200 ${
                            isActive
                              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20 dark:bg-brand-500"
                              : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Templates Grid — full 100% width */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {SHOP_TEMPLATE_PRESETS.filter((preset) =>
                      selectedCategory === "all"
                        ? true
                        : preset.category === selectedCategory,
                    ).map((preset) => {
                      const active = archetype === preset.id;
                      const isCustomBuilder = preset.id === "custom-drag-drop";

                      return (
                        <div
                          key={preset.id}
                          className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                            isCustomBuilder
                              ? "border-purple-500/40 bg-slate-900 text-white shadow-lg shadow-purple-500/10"
                              : active
                                ? "border-brand-500 bg-white shadow-xl shadow-brand-500/10 ring-4 ring-brand-500/15 dark:border-brand-500 dark:bg-gray-900"
                                : "border-gray-200 bg-white shadow-sm hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:border-brand-500/40"
                          }`}
                        >
                          {/* Wireframe Silhouette Container */}
                          <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-950">
                            <ArchetypeWireframe
                              id={preset.id}
                              colors={preset.preview}
                            />

                            {/* Status Badge Top-Right */}
                            {active ? (
                              <div className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-lg shadow-emerald-500/20 backdrop-blur-xs">
                                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                                <HiOutlineCheckCircle size={13} aria-hidden />
                                Đang dùng
                              </div>
                            ) : isCustomBuilder ? (
                              <div className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold text-slate-950 shadow-lg backdrop-blur-xs">
                                <HiOutlineSparkles size={12} aria-hidden />
                                NỔI BẬT
                              </div>
                            ) : null}
                          </div>

                          {/* Card Body Info */}
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                className={`text-sm font-black transition-colors ${
                                  isCustomBuilder
                                    ? "text-white"
                                    : "text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400"
                                }`}
                              >
                                {preset.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  isCustomBuilder
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                                }`}
                              >
                                {preset.inspiredBy}
                              </span>
                            </div>

                            <p
                              className={`line-clamp-2 text-xs leading-relaxed ${
                                isCustomBuilder
                                  ? "text-slate-300"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {preset.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {preset.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                                    isCustomBuilder
                                      ? "bg-white/10 text-slate-300"
                                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Bottom Card Action Button */}
                            <div className="mt-auto pt-3">
                              {isCustomBuilder ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectTemplate(preset.id);
                                    setTab("builder");
                                  }}
                                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-400 py-2 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-amber-300 active:scale-[0.98]"
                                >
                                  <HiOutlinePaintBrush size={14} />
                                  Mở Trình Tạo Trang Builder
                                </button>
                              ) : active ? (
                                <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  <HiOutlineCheckCircle size={15} />
                                  Kiến trúc đang sử dụng
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectTemplate(preset.id)}
                                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2 text-xs font-bold text-gray-700 transition-all group-hover:border-brand-500 group-hover:bg-brand-600 group-hover:text-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:group-hover:bg-brand-500 active:scale-[0.98]"
                                >
                                  Áp dụng kiến trúc này
                                  <HiOutlineArrowRight size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tab === "pdp" ? (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    Giao diện trang chi tiết sản phẩm (PDP) — độc lập với kiến
                    trúc trang chủ.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {PDP_TEMPLATE_PRESETS.map((preset) => {
                      const active =
                        (resolved.pdpTemplateId || "bento-tech") === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            patch({
                              pdpTemplateId: preset.id as PDPTemplateType,
                            })
                          }
                          aria-pressed={active}
                          className={`cursor-pointer rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                            active
                              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 dark:bg-brand-500/10"
                              : "border-gray-200 hover:border-brand-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="mb-3 h-20 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <PDPWireframe id={preset.id} />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {preset.name}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                            {preset.inspiredBy}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {preset.description}
                          </p>
                          {active ? (
                            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                              <HiOutlineCheckCircle size={12} aria-hidden />
                              Đang chọn
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tab === "colors" ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    Màu tùy chỉnh áp dụng trực tiếp lên mẫu kiến trúc đã chọn.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ColorField
                      label="Màu chữ & tiêu đề (Primary)"
                      value={resolved.primaryColor}
                      onChange={(v) => patch({ primaryColor: v })}
                    />
                    <ColorField
                      label="Màu điểm nhấn & nút (Accent)"
                      value={resolved.accentColor}
                      onChange={(v) => patch({ accentColor: v })}
                    />
                    <ColorField
                      label="Màu nền trang (Background)"
                      value={resolved.backgroundColor}
                      onChange={(v) => patch({ backgroundColor: v })}
                    />
                    <ColorField
                      label="Màu thẻ & khung (Surface)"
                      value={resolved.surfaceColor}
                      onChange={(v) => patch({ surfaceColor: v })}
                    />
                    <ColorField
                      label="Màu phụ & mô tả (Muted)"
                      value={resolved.mutedColor}
                      onChange={(v) => patch({ mutedColor: v })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Chế độ sáng / tối
                      </span>
                      <CustomSelect
                        value={resolved.themeMode}
                        onChange={(v) =>
                          patch({
                            themeMode: (v || "light") as "light" | "dark",
                          })
                        }
                        options={THEME_MODE_OPTIONS}
                        aria-label="Chế độ sáng tối"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "content" ? (
                <div className="space-y-5">
                  <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/40 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Banner & Hero
                    </h3>
                    <FieldInput
                      label="Tiêu đề Hero"
                      value={draft.heroTitle ?? ""}
                      onChange={(v) => patch({ heroTitle: v })}
                      placeholder="VD: Cửa hàng chuẩn PRO"
                    />
                    <FieldInput
                      label="Mô tả / sub-headline"
                      value={draft.heroSubtitle ?? ""}
                      onChange={(v) => patch({ heroSubtitle: v })}
                      placeholder="Mô tả ngắn gọn về sản phẩm/dịch vụ"
                      multiline
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FieldInput
                        label="Nút CTA"
                        value={draft.ctaText ?? ""}
                        onChange={(v) => patch({ ctaText: v })}
                      />
                      <FieldInput
                        label="Thanh thông báo"
                        value={draft.announcement ?? ""}
                        onChange={(v) => patch({ announcement: v })}
                        placeholder="Chỉ hiện khi bật announcement"
                      />
                    </div>
                  </section>

                  <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/40 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <HiOutlinePhone size={12} aria-hidden />
                        Liên hệ & mạng xã hội
                      </h3>
                      <Tooltip content="Hiển thị ở header và chân trang storefront">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          Header & Footer
                        </span>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Hotline / Zalo"
                        value={draft.contactPhone ?? ""}
                        onChange={(v) => patch({ contactPhone: v })}
                        placeholder="0987654321"
                      />
                      <FieldInput
                        label="Link Zalo / OA"
                        value={draft.contactZalo ?? ""}
                        onChange={(v) => patch({ contactZalo: v })}
                        placeholder="https://zalo.me/..."
                      />
                      <FieldInput
                        label="Facebook / Fanpage"
                        value={draft.contactFacebook ?? ""}
                        onChange={(v) => patch({ contactFacebook: v })}
                        placeholder="https://facebook.com/..."
                      />
                      <FieldInput
                        label="Website"
                        value={draft.contactWebsite ?? ""}
                        onChange={(v) => patch({ contactWebsite: v })}
                        placeholder="https://..."
                      />
                    </div>
                    <FieldInput
                      label="Địa chỉ cửa hàng"
                      value={draft.contactAddress ?? ""}
                      onChange={(v) => patch({ contactAddress: v })}
                      placeholder="123 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    />
                  </section>
                </div>
              ) : null}
            </div>

            {/* Preview rail — hidden on templates tab to allow 100% full-width grid */}
            {tab !== "templates" ? (
              <aside className="w-full shrink-0 overflow-y-auto border-t border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-black/10 lg:w-[300px] lg:border-l lg:border-t-0 xl:w-[320px]">
                <div className="lg:sticky lg:top-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <HiOutlineSparkles size={12} aria-hidden />
                    Xem trước kiến trúc
                  </p>
                  <ThemePreview data={resolved} />
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
