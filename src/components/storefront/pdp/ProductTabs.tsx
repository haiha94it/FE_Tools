"use client";

import { parseSpecsFromDescription } from "@/components/storefront/pdp/pdp-utils";
import ProductReviews from "@/components/storefront/pdp/ProductReviews";
import type { PDPTabsLayout } from "@/types/pdp-template";
import type { ShopProduct } from "@/types/zalo-shop";
import { useState } from "react";

type TabId = "description" | "specs" | "reviews" | "shipping";

interface ProductTabsProps {
  product: ShopProduct;
  layout?: PDPTabsLayout;
  reviewCount?: number;
}

/** Rich Text & Bullet Formatted Description Component */
function FormattedDescription({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 450;

  // Clean HTML tags and split lines
  const cleanContent = content.replace(/<[^>]+>/g, "\n");
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  return (
    <div className="relative">
      <div
        className={`space-y-3.5 transition-all duration-500 ${
          !expanded && isLong ? "max-h-72 overflow-hidden" : ""
        }`}
      >
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          const isBullet =
            trimmed.startsWith("-") ||
            trimmed.startsWith("•") ||
            trimmed.startsWith("*") ||
            trimmed.startsWith("✓");

          if (isBullet) {
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-600">
                  ✓
                </span>
                <span className="leading-relaxed">
                  {trimmed.replace(/^[-•*✓]\s*/, "")}
                </span>
              </div>
            );
          }

          if (trimmed.includes(":") && trimmed.length < 90) {
            const [key, ...valParts] = trimmed.split(":");
            const val = valParts.join(":");
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs text-xs sm:text-sm"
              >
                <span className="font-bold text-slate-900">{key.trim()}</span>
                <span className="text-slate-600 font-medium">{val.trim()}</span>
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-xs sm:text-sm leading-relaxed text-slate-700 font-normal"
            >
              {trimmed}
            </p>
          );
        })}
      </div>

      {!expanded && isLong ? (
        <div className="absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-1">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="store-press inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-black"
          >
            <span>Xem đầy đủ mô tả</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : isLong ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="store-press inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all hover:bg-slate-50"
          >
            <span>Thu gọn mô tả</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ProductTabs({
  product,
  layout = "horizontal-tabs",
  reviewCount = 128,
}: ProductTabsProps) {
  const [active, setActive] = useState<TabId>("description");
  const specs = parseSpecsFromDescription(product.description);
  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: "Mô tả sản phẩm" },
    { id: "specs", label: "Thông số kỹ thuật" },
    { id: "reviews", label: `Đánh giá (${reviewCount})` },
    { id: "shipping", label: "Chính sách giao hàng" },
  ];

  const body = (id: TabId) => {
    if (id === "description") {
      return product.description ? (
        <FormattedDescription content={product.description} />
      ) : (
        <p className="text-sm text-slate-500">Chưa có mô tả sản phẩm.</p>
      );
    }
    if (id === "specs") {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          {specs.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 gap-3 px-4 py-3.5 text-xs sm:text-sm ${
                i % 2 === 0 ? "bg-slate-50/70" : "bg-white"
              } divide-x divide-slate-100 border-b border-slate-100 last:border-0`}
            >
              <span className="col-span-1 font-bold text-slate-700">
                {row.label}
              </span>
              <span className="col-span-2 pl-3 font-medium text-slate-900">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    if (id === "reviews") {
      return <ProductReviews product={product} />;
    }
    return (
      <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-white p-5 text-xs sm:text-sm text-slate-700 shadow-2xs">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600">
            ✓
          </span>
          <div>
            <p className="font-bold text-slate-900">Giao Hàng Toàn Quốc</p>
            <p className="mt-0.5 text-slate-500">Thời gian 2 – 5 ngày làm việc tùy khu vực tỉnh thành.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-bold text-sky-600">
            ✓
          </span>
          <div>
            <p className="font-bold text-slate-900">Kiểm Tra Hàng (COD)</p>
            <p className="mt-0.5 text-slate-500">Khách hàng được mở kiểm tra đúng hàng trước khi thanh toán.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600">
            ✓
          </span>
          <div>
            <p className="font-bold text-slate-900">Đổi Trả Miễn Phí 7 Ngày</p>
            <p className="mt-0.5 text-slate-500">Bảo hành lỗi nhà sản xuất hoặc đổi mới nếu không đúng mô tả.</p>
          </div>
        </div>
        {product.phone_number ? (
          <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-500/10 text-xs font-bold text-pink-600">
              📞
            </span>
            <div>
              <p className="font-bold text-slate-900">Hotline Hỗ Trợ 24/7</p>
              <a
                href={`tel:${product.phone_number}`}
                className="mt-0.5 inline-block font-extrabold text-pink-600 hover:underline"
              >
                {product.phone_number}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  if (layout === "accordion") {
    return (
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {tabs.map((tab) => {
          const open = active === tab.id;
          return (
            <div key={tab.id}>
              <button
                type="button"
                onClick={() => setActive(open ? "description" : tab.id)}
                className="flex w-full cursor-pointer items-center justify-between py-4 text-left text-sm font-bold text-slate-900"
              >
                {tab.label}
                <span className="text-lg text-slate-400">{open ? "−" : "+"}</span>
              </button>
              {open ? <div className="pb-5">{body(tab.id)}</div> : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (layout === "stacked-sections") {
    return (
      <div className="space-y-10">
        {tabs.map((tab) => (
          <section key={tab.id} id={`pdp-${tab.id}`}>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl border-b border-slate-200 pb-2">
              {tab.label}
            </h3>
            <div className="mt-4">{body(tab.id)}</div>
          </section>
        ))}
      </div>
    );
  }

  /* horizontal sticky tabs */
  return (
    <section className="store-pdp-details mt-8 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-lg backdrop-blur-xl sm:mt-12 sm:p-8">
      <div className="sticky top-20 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/90 p-1.5 backdrop-blur-md sm:top-24">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm ${
              active === tab.id
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">{body(active)}</div>
    </section>
  );
}
