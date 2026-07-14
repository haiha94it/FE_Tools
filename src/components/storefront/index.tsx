"use client";

import StoreCategoryRail from "@/components/storefront/StoreCategoryRail";
import StoreHero from "@/components/storefront/StoreHero";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreProductGrid from "@/components/storefront/StoreProductGrid";
import StoreShell from "@/components/storefront/StoreShell";
import StoreToolbar from "@/components/storefront/StoreToolbar";
import { isProductActive, sortProducts } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import type { ShopCategory, ShopCover, ShopProduct, ShopSortOption } from "@/types/zalo-shop";
import { useEffect, useMemo, useState } from "react";

interface StorefrontHomeProps {
  sellerId: string;
}

export default function StorefrontHome({ sellerId }: StorefrontHomeProps) {
  const [cover, setCover] = useState<ShopCover | null>(null);
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
          zaloShopService.listProducts({ employeeId: sellerId, pageSize: 50 }),
        ]);
        if (cancelled) return;
        setCover(coverData);
        setCategories(cateData.filter((c) => c.status === 1));
        setProducts(productData.results.filter(isProductActive));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return sortProducts(list, sort);
  }, [products, search, sort]);

  const publishedCategories = categories.filter((c) => c.status === 1);

  return (
    <StoreShell sellerId={sellerId} cover={cover}>
      <StoreHero
        cover={cover}
        productCount={products.length}
        categoryCount={publishedCategories.length}
      />

      <StoreCategoryRail
        sellerId={sellerId}
        categories={publishedCategories}
      />

      <section id="products" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <StoreToolbar
          title="Sản phẩm nổi bật"
          subtitle={`${filteredProducts.length} sản phẩm đang hiển thị`}
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />

        {loading ? (
          <StoreLoading />
        ) : (
          <StoreProductGrid
            products={filteredProducts}
            sellerId={sellerId}
            featured
          />
        )}
      </section>
    </StoreShell>
  );
}