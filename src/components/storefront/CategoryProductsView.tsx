"use client";

import StoreCategoryRail from "@/components/storefront/StoreCategoryRail";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreProductGrid from "@/components/storefront/StoreProductGrid";
import StoreReveal from "@/components/storefront/StoreReveal";
import StoreShell from "@/components/storefront/StoreShell";
import StoreToolbar from "@/components/storefront/StoreToolbar";
import {
  gridDensityClass,
  resolvePersonalization,
} from "@/lib/shop-personalization";
import { isProductActive, sortProducts } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import type {
  ShopCategory,
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
  ShopSortOption,
} from "@/types/zalo-shop";
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
  const [personalization, setPersonalization] =
    useState<ShopPersonalizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ShopSortOption>("default");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [coverData, cateData, productData, personalData] =
          await Promise.all([
            zaloShopService.getCover(sellerId),
            zaloShopService.listCategories(sellerId),
            zaloShopService.listProducts({
              employeeId: sellerId,
              categoryId,
              pageSize: 50,
            }),
            zaloShopService.getPersonalization(sellerId).catch(() => ({
              id: null,
              data: {},
            })),
          ]);
        if (cancelled) return;
        setCover(coverData);
        const published = cateData.filter((c) => c.status === 1);
        setCategories(published);
        setCategory(published.find((c) => c.id === categoryId) ?? null);
        setProducts(productData.results.filter(isProductActive));
        setPersonalization(
          (personalData.data ?? {}) as ShopPersonalizationData,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, categoryId]);

  const config = useMemo(
    () => resolvePersonalization(personalization),
    [personalization],
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return sortProducts(list, sort);
  }, [products, search, sort]);

  return (
    <StoreShell
      sellerId={sellerId}
      cover={cover}
      search={search}
      onSearchChange={setSearch}
      products={products}
      personalization={personalization}
    >
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5">
        <StoreReveal variant="fade" immediate delay={0}>
          <Link
            href={`/store/${sellerId}`}
            className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[var(--store-accent)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </StoreReveal>

        <StoreReveal variant="up" immediate delay={1} className="mt-3">
          <div
            className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 px-5 py-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6"
            style={{ backgroundColor: "var(--store-surface, #fff)" }}
          >
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--store-accent)]">
                Danh mục
              </p>
              <h1 className="store-display mt-1 text-2xl text-[var(--store-primary)] sm:text-3xl">
                {category?.name || "Bộ sưu tập"}
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {filteredProducts.length} sản phẩm
            </p>
          </div>
        </StoreReveal>
      </section>

      {config.showCategoryRail ? (
        <StoreReveal variant="up" delay={2}>
          <StoreCategoryRail
            sellerId={sellerId}
            categories={categories}
            activeId={categoryId}
          />
        </StoreReveal>
      ) : null}

      <section
        id="products"
        className="mx-auto max-w-7xl scroll-mt-36 px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-6"
      >
        <StoreReveal variant="up" delay={1}>
          <StoreToolbar
            title={category?.name || "Sản phẩm"}
            subtitle={`${filteredProducts.length} sản phẩm đang hiển thị`}
            sort={sort}
            onSortChange={setSort}
          />
        </StoreReveal>

        {loading ? (
          <StoreLoading />
        ) : (
          <StoreProductGrid
            products={filteredProducts}
            sellerId={sellerId}
            categoryId={categoryId}
            densityClass={gridDensityClass(config.gridDensity)}
            cardStyle={config.productCardStyle}
            showHotBadge={config.showHotBadge}
            showFlashBadge={config.showFlashBadge}
          />
        )}
      </section>
    </StoreShell>
  );
}
