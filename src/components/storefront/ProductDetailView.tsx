"use client";

import ProductBuyPanel from "@/components/storefront/ProductBuyPanel";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductStickyBar from "@/components/storefront/ProductStickyBar";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreProductCard from "@/components/storefront/StoreProductCard";
import StoreShell from "@/components/storefront/StoreShell";
import { isProductActive, shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopCover, ShopProduct, ShopProductVariant } from "@/types/zalo-shop";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface ProductDetailViewProps {
  sellerId: string;
  categoryId: number;
  productId: number;
}

type DetailTab = "description" | "shipping";

export default function ProductDetailView({
  sellerId,
  categoryId,
  productId,
}: ProductDetailViewProps) {
  const addToCart = useShopCartStore((s) => s.addToCart);
  const openCheckout = useShopCartStore((s) => s.openCheckout);
  const isLoading = useShopCartStore((s) => s.isLoading);

  const [cover, setCover] = useState<ShopCover | null>(null);
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ShopProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");
  const [showStickyBar, setShowStickyBar] = useState(false);

  const buyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [coverData, productData] = await Promise.all([
          zaloShopService.getCover(sellerId),
          zaloShopService.listProducts({
            employeeId: sellerId,
            categoryId,
          }),
        ]);
        if (cancelled) return;
        setCover(coverData);
        const found = productData.results.find((p) => p.id === productId) ?? null;
        setProduct(found);
        setSelectedVariant(found?.variants[0] ?? null);
        setRelated(
          productData.results
            .filter((p) => p.id !== productId && isProductActive(p))
            .slice(0, 4),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, categoryId, productId]);

  useEffect(() => {
    const node = buyPanelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, product]);

  const displayPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return Number(selectedVariant.price);
  }, [selectedVariant]);

  const maxQty = useMemo(() => {
    if (!selectedVariant) return 1;
    const total = Number(selectedVariant.total_quantity);
    const sold = Number(selectedVariant.sold_quantity ?? 0);
    return Math.max(1, total - sold);
  }, [selectedVariant]);

  const purchase = async (buyNow = false) => {
    if (!selectedVariant?.id) {
      toast.error("Vui lòng chọn phân loại");
      return;
    }
    if (product?.sell_option === 1 && product.link_zalo) {
      window.open(product.link_zalo, "_blank");
      return;
    }
    await addToCart({
      id_employee: Number(sellerId),
      options: [{ id_variant: selectedVariant.id, quantity }],
    });
    if (buyNow) openCheckout();
  };

  if (loading) {
    return (
      <div className="store-theme store-mesh-bg min-h-screen">
        <StoreLoading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="store-theme store-mesh-bg flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="store-display text-xl text-[var(--store-primary)]">Không tìm thấy sản phẩm</p>
        <Link
          href={`/store/${sellerId}`}
          className="mt-4 cursor-pointer text-sm font-medium text-[var(--store-accent)]"
        >
          Về cửa hàng
        </Link>
      </div>
    );
  }

  const images = product.images.map(shopImageUrl);
  const storeName = cover?.name || "Cửa hàng";

  return (
    <StoreShell sellerId={sellerId} cover={cover}>
      <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:pb-16 lg:pt-2">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/store/${sellerId}`}
            className="cursor-pointer font-medium text-[var(--store-muted)] transition hover:text-[var(--store-accent)]"
          >
            {storeName}
          </Link>
          <span className="text-[var(--store-muted)]/40">/</span>
          <Link
            href={`/store/${sellerId}/${categoryId}`}
            className="cursor-pointer font-medium text-[var(--store-muted)] transition hover:text-[var(--store-accent)]"
          >
            Danh mục
          </Link>
          <span className="text-[var(--store-muted)]/40">/</span>
          <span className="line-clamp-1 font-medium text-[var(--store-primary)]">{product.title}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 xl:gap-20">
          <ProductGallery images={images} title={product.title} />

          <div ref={buyPanelRef}>
            <ProductBuyPanel
              product={product}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
              quantity={quantity}
              onQuantityChange={setQuantity}
              maxQty={maxQty}
              isLoading={isLoading}
              onAddToCart={() => void purchase(false)}
              onBuyNow={() => void purchase(true)}
            />
          </div>
        </div>

        <section className="store-pdp-details mt-12 rounded-[2rem] p-6 sm:mt-16 sm:p-8">
          <div className="flex gap-1 rounded-2xl bg-zinc-100/80 p-1">
            {(
              [
                { id: "description" as const, label: "Mô tả sản phẩm" },
                { id: "shipping" as const, label: "Giao hàng & đổi trả" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-[var(--store-primary)] shadow-sm"
                    : "text-[var(--store-muted)] hover:text-[var(--store-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "description" ? (
              product.description ? (
                <div className="whitespace-pre-wrap text-sm leading-[1.8] text-[var(--store-primary)]/85 sm:text-base">
                  {product.description}
                </div>
              ) : (
                <p className="text-sm text-[var(--store-muted)]">Chưa có mô tả cho sản phẩm này.</p>
              )
            ) : (
              <ul className="space-y-4 text-sm leading-relaxed text-[var(--store-primary)]/85 sm:text-base">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
                  Giao hàng toàn quốc, thời gian 2–5 ngày làm việc tùy khu vực.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
                  Hỗ trợ thanh toán COD — kiểm tra hàng trước khi thanh toán.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
                  Đổi trả trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.
                </li>
                {product.phone_number ? (
                  <li className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--store-accent)]" />
                    Liên hệ hỗ trợ:{" "}
                    <a
                      href={`tel:${product.phone_number}`}
                      className="font-semibold text-[var(--store-accent)]"
                    >
                      {product.phone_number}
                    </a>
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-16 sm:mt-24">
            <div className="store-pdp-related-head flex flex-col gap-4 rounded-[2rem] px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">
                  Gợi ý cho bạn
                </p>
                <h2 className="store-display mt-2 text-2xl text-white sm:text-3xl">
                  Có thể bạn thích
                </h2>
              </div>
              <Link
                href={`/store/${sellerId}/${categoryId}`}
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                Xem tất cả
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {related.map((item, index) => (
                <StoreProductCard
                  key={item.id}
                  product={item}
                  sellerId={sellerId}
                  categoryId={categoryId}
                  index={index}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <ProductStickyBar
        visible={showStickyBar}
        title={product.title}
        price={displayPrice}
        isLoading={isLoading}
        isZalo={product.sell_option === 1}
        onAddToCart={() => void purchase(false)}
        onBuyNow={() => void purchase(true)}
      />
    </StoreShell>
  );
}