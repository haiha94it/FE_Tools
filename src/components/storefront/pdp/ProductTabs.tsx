"use client";

import {
  parseSpecsFromDescription,
} from "@/components/storefront/pdp/pdp-utils";
import type { PDPTabsLayout } from "@/types/pdp-template";
import type { ShopProduct } from "@/types/zalo-shop";
import { useState } from "react";
import ProductReviews from "@/components/storefront/pdp/ProductReviews";

type TabId = "description" | "specs" | "reviews" | "shipping";

interface ProductTabsProps {
  product: ShopProduct;
  layout?: PDPTabsLayout;
  reviewCount?: number;
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
    { id: "shipping", label: "Giao hàng & đổi trả" },
  ];

  const body = (id: TabId) => {
    if (id === "description") {
      return product.description ? (
        <div className="whitespace-pre-wrap text-sm leading-[1.8] text-[var(--store-primary)]/85 sm:text-base">
          {product.description.replace(/<[^>]+>/g, "")}
        </div>
      ) : (
        <p className="text-sm text-[var(--store-muted)]">Chưa có mô tả.</p>
      );
    }
    if (id === "specs") {
      return (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          {specs.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 gap-3 px-4 py-3 text-sm ${
                i % 2 === 0 ? "bg-slate-50/80" : "bg-white"
              } divide-x divide-slate-100 border-b border-slate-100 last:border-0`}
            >
              <span className="col-span-1 font-semibold text-slate-600">
                {row.label}
              </span>
              <span className="col-span-2 pl-3 text-[var(--store-primary)]">
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
      <ul className="space-y-3 text-sm leading-relaxed text-[var(--store-primary)]/85">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
          Giao hàng toàn quốc, 2–5 ngày làm việc tùy khu vực.
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
          COD — kiểm tra hàng trước khi thanh toán.
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
          Đổi trả 7 ngày nếu lỗi NSX hoặc không đúng mô tả.
        </li>
        {product.phone_number ? (
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
            Hotline:{" "}
            <a
              href={`tel:${product.phone_number}`}
              className="font-semibold text-[var(--store-accent)]"
            >
              {product.phone_number}
            </a>
          </li>
        ) : null}
      </ul>
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
                className="flex w-full cursor-pointer items-center justify-between py-4 text-left text-sm font-bold text-[var(--store-primary)]"
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
      <div className="space-y-12">
        {tabs.map((tab) => (
          <section key={tab.id} id={`pdp-${tab.id}`}>
            <h3 className="store-display text-xl text-[var(--store-primary)] sm:text-2xl">
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
    <section className="store-pdp-details mt-10 rounded-[1.75rem] border border-slate-100 bg-white/90 p-4 shadow-sm sm:mt-14 sm:p-7">
      <div className="sticky top-20 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-2xl bg-zinc-100/90 p-1 backdrop-blur sm:top-24">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-3.5 py-2.5 text-xs font-bold transition sm:text-sm ${
              active === tab.id
                ? "bg-white text-[var(--store-primary)] shadow-sm"
                : "text-[var(--store-muted)] hover:text-[var(--store-primary)]"
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
