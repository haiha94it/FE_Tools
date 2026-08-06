"use client";

import StoreCategoryRail from "@/components/storefront/StoreCategoryRail";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreProductGrid from "@/components/storefront/StoreProductGrid";
import StoreShell from "@/components/storefront/StoreShell";
import StoreToolbar from "@/components/storefront/StoreToolbar";
import { isProductActive, sortProducts } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import type { ShopCategory, ShopCover, ShopProduct, ShopSortOption } from "@/types/zalo-shop";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface CategoryProductsViewProps {
  sellerId: string;
  categoryId: number;
}

export default function CategoryProductsView({
  sellerId,
  categoryId,
}: CategoryProductsViewProps) {
  const [cover, setCover] = useState<ShopCover | null>(null);
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ShopSortOption>("default");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [coverData, cateData, productData] = await Promise.all([
          zaloShopService.getCover(sellerId),
          zaloShopService.listCategories(sellerId),
          zaloShopService.listProducts({
            employeeId: sellerId,
            categoryId,
            pageSize: 50,
          }),
        ]);
        if (cancelled) return;
        setCover(coverData);
        const published = cateData.filter((c) => c.status === 1);
        setCategories(published);
        // Chỉ list DM đã duyệt cho khách
        setCategory(published.find((c) => c.id === categoryId) ?? null);
        setProducts(productData.results.filter(isProductActive));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, categoryId]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return sortProducts(list, sort);
  }, [products, search, sort]);

  return (
    <StoreShell sellerId={sellerId} cover={cover}>
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Link
          href={`/store/${sellerId}`}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--store-muted)] transition hover:text-[var(--store-accent)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Trang chủ
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] bg-[var(--store-primary)] px-8 py-12 sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">
            Danh mục
          </p>
          <h1 className="store-display mt-3 text-3xl text-white sm:text-4xl lg:text-5xl">
            {category?.name || "Bộ sưu tập"}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            {filteredProducts.length} sản phẩm được tuyển chọn
          </p>
        </div>
      </section>

      <StoreCategoryRail
        sellerId={sellerId}
        categories={categories}
        activeId={categoryId}
      />

      <section className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <StoreToolbar
          title={category?.name || "Sản phẩm"}
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          searchPlaceholder="Lọc trong danh mục..."
        />

        {loading ? (
          <StoreLoading />
        ) : (
          <StoreProductGrid
            products={filteredProducts}
            sellerId={sellerId}
            categoryId={categoryId}
          />
        )}
      </section>
    </StoreShell>
  );
}