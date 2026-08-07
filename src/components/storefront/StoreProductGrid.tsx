"use client";

import StoreProductCard from "@/components/storefront/StoreProductCard";
import type { ShopProduct, ShopProductCardStyle } from "@/types/zalo-shop";

interface StoreProductGridProps {
  products: ShopProduct[];
  sellerId: string;
  categoryId?: number;
  /** @deprecated Grid is always dense; kept for API compatibility */
  featured?: boolean;
  onQuickView?: (product: ShopProduct) => void;
  densityClass?: string;
  cardStyle?: ShopProductCardStyle;
  showHotBadge?: boolean;
  showFlashBadge?: boolean;
}

export default function StoreProductGrid({
  products,
  sellerId,
  categoryId,
  onQuickView,
  densityClass = "gap-3 sm:gap-4",
  cardStyle = "comfortable",
  showHotBadge = true,
  showFlashBadge = true,
}: StoreProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="text-base font-bold text-slate-900">Không tìm thấy sản phẩm</p>
        <p className="mt-1 text-sm text-slate-500">Thử từ khóa khác hoặc chọn danh mục khác</p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 ${densityClass}`}
    >
      {products.map((product, index) => (
        <StoreProductCard
          key={product.id}
          product={product}
          sellerId={sellerId}
          categoryId={categoryId}
          index={index}
          onQuickView={onQuickView}
          cardStyle={cardStyle}
          showHotBadge={showHotBadge}
          showFlashBadge={showFlashBadge}
        />
      ))}
    </div>
  );
}
