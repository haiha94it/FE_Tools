"use client";

import { StorefrontLayoutRouter } from "@/components/storefront/layouts";
import StoreQuickViewModal from "@/components/storefront/StoreQuickViewModal";
import StoreShell from "@/components/storefront/StoreShell";
import { resolveArchetypeId, resolvePersonalization } from "@/lib/shop-personalization";
import { isProductActive, sortProducts } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import type {
  ShopCategory,
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
  ShopSortOption,
} from "@/types/zalo-shop";
import { useEffect, useMemo, useState } from "react";

interface StorefrontHomeProps {
  sellerId: string;
}

export default function StorefrontHome({ sellerId }: StorefrontHomeProps) {
  const [cover, setCover] = useState<ShopCover | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [personalization, setPersonalization] =
    useState<ShopPersonalizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ShopSortOption>("default");
  const [quickViewProduct, setQuickViewProduct] = useState<ShopProduct | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [coverData, cateData, productData, personalData] =
          await Promise.all([
            zaloShopService.getCover(sellerId),
            zaloShopService.listCategories(sellerId),
            zaloShopService.listProducts({ employeeId: sellerId, pageSize: 50 }),
            zaloShopService.getPersonalization(sellerId).catch(() => ({
              id: null,
              data: {},
            })),
          ]);
        if (cancelled) return;
        setCover(coverData);
        setCategories(cateData.filter((c) => c.status === 1));
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
  }, [sellerId]);

  const baseConfig = useMemo(
    () => resolvePersonalization(personalization),
    [personalization],
  );

  const activeArchetype = resolveArchetypeId(baseConfig.templateId);

  const config = useMemo(() => {
    return {
      ...baseConfig,
      templateId: activeArchetype,
    };
  }, [baseConfig, activeArchetype]);

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
    <StoreShell
      sellerId={sellerId}
      cover={cover}
      search={search}
      onSearchChange={setSearch}
      products={products}
      personalization={config}
    >
      <StorefrontLayoutRouter
        sellerId={sellerId}
        cover={cover}
        categories={publishedCategories}
        products={products}
        filteredProducts={filteredProducts}
        config={config}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onQuickView={setQuickViewProduct}
      />

      <StoreQuickViewModal
        product={quickViewProduct}
        sellerId={sellerId}
        onClose={() => setQuickViewProduct(null)}
      />
    </StoreShell>
  );
}
