"use client";

import StoreProductCard from "@/components/storefront/StoreProductCard";
import type { ShopProduct } from "@/types/zalo-shop";

interface StoreProductGridProps {
  products: ShopProduct[];
  sellerId: string;
  categoryId?: number;
  featured?: boolean;
}

export default function StoreProductGrid({
  products,
  sellerId,
  categoryId,
  featured = false,
}: StoreProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="store-glass flex flex-col items-center justify-center rounded-3xl py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--store-accent-soft)]">
          <svg className="h-7 w-7 text-[var(--store-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="store-display text-lg text-[var(--store-primary)]">Không tìm thấy sản phẩm</p>
        <p className="mt-1 text-sm text-[var(--store-muted)]">Thử từ khóa khác hoặc chọn danh mục khác</p>
      </div>
    );
  }

  if (!featured || products.length < 3) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <StoreProductCard
            key={product.id}
            product={product}
            sellerId={sellerId}
            categoryId={categoryId}
            index={index}
          />
        ))}
      </div>
    );
  }

  const [hero, second, ...rest] = products;

  return (
    <div className="space-y-5">
      <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-2">
        <StoreProductCard
          product={hero}
          sellerId={sellerId}
          categoryId={categoryId}
          size="featured"
          index={0}
        />
        <StoreProductCard
          product={second}
          sellerId={sellerId}
          categoryId={categoryId}
          size="featured"
          index={1}
        />
      </div>
      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {rest.map((product, index) => (
            <StoreProductCard
              key={product.id}
              product={product}
              sellerId={sellerId}
              categoryId={categoryId}
              index={index + 2}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}