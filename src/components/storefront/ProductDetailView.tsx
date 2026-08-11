"use client";

import ProductBuyPanel from "@/components/storefront/ProductBuyPanel";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductStickyBar from "@/components/storefront/ProductStickyBar";
import ProductTabs from "@/components/storefront/pdp/ProductTabs";
import {
  productSocialProof,
  variantPrice,
  variantStock,
} from "@/components/storefront/pdp/pdp-utils";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreProductCard from "@/components/storefront/StoreProductCard";
import StoreReveal from "@/components/storefront/StoreReveal";
import StoreShell from "@/components/storefront/StoreShell";
import SectionRenderer from "@/components/shop-admin/layout-canvas/renderers/SectionRenderer";
import { resolvePdpLayoutCanvas } from "@/lib/shop-layout-canvas";
import { resolvePersonalization } from "@/lib/shop-personalization";
import { isProductActive, shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import {
  resolvePDPConfig,
  type PDPConfig,
} from "@/types/pdp-template";
import type {
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
  ShopProductVariant,
} from "@/types/zalo-shop";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface ProductDetailViewProps {
  sellerId: string;
  categoryId: number;
  productId: number;
}

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
  const [personalization, setPersonalization] =
    useState<ShopPersonalizationData | null>(null);
  const [selectedVariant, setSelectedVariant] =
    useState<ShopProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const buyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [coverData, productData, personalData] = await Promise.all([
          zaloShopService.getCover(sellerId),
          zaloShopService.listProducts({
            employeeId: sellerId,
            categoryId,
          }),
          zaloShopService.getPersonalization(sellerId).catch(() => ({
            id: null,
            data: {},
          })),
        ]);
        if (cancelled) return;
        setCover(coverData);
        setPersonalization(
          (personalData.data ?? {}) as ShopPersonalizationData,
        );
        const found =
          productData.results.find((p) => p.id === productId) ?? null;
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

  const shopConfig = useMemo(
    () => resolvePersonalization(personalization),
    [personalization],
  );

  const pdp: PDPConfig = useMemo(
    () => resolvePDPConfig(shopConfig.pdpTemplateId),
    [shopConfig.pdpTemplateId],
  );

  const pdpLayoutDoc = useMemo(
    () => resolvePdpLayoutCanvas(personalization),
    [personalization],
  );

  const displayPrice = useMemo(() => {
    if (!selectedVariant) return 0;
    return Number(selectedVariant.price);
  }, [selectedVariant]);

  const maxQty = useMemo(() => {
    if (!selectedVariant) return 1;
    return Math.max(1, variantStock(selectedVariant));
  }, [selectedVariant]);

  const discountPct = useMemo(() => {
    if (!selectedVariant) return 0;
    return variantPrice(selectedVariant).discountPct;
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
        <p className="store-display text-xl text-[var(--store-primary)]">
          Không tìm thấy sản phẩm
        </p>
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
  const proof = productSocialProof(product);
  const templateId = pdp.templateId;

  const breadcrumb = (
    <StoreReveal variant="fade" immediate delay={0}>
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
        <span className="line-clamp-1 font-medium text-[var(--store-primary)]">
          {product.title}
        </span>
      </nav>
    </StoreReveal>
  );

  const buyPanel = (
    <div ref={buyPanelRef} className="store-anim-slide-left store-delay-2">
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
        panelStyle={pdp.buyPanelStyle}
        showCountdown={pdp.showCountdownTimer || Boolean(product.is_flash_sale)}
        showStockBar={pdp.showStockProgressBar}
        dense={templateId === "dense-deal"}
        minimal={templateId === "minimal-gallery"}
      />
    </div>
  );

  const galleryProps = {
    images,
    title: product.title,
    product,
    discountPct,
    aspect: pdp.galleryAspect,
  };

  const tabs = (
    <StoreReveal variant="up" delay={2}>
      <ProductTabs
        product={product}
        layout={pdp.tabsLayout}
        reviewCount={proof.reviews}
      />
    </StoreReveal>
  );

  const relatedBlock =
    related.length > 0 ? (
      <StoreReveal variant="up" delay={1} className="mt-14 sm:mt-20">
        <section>
          <div className="store-pdp-related-head flex flex-col gap-4 rounded-[2rem] px-6 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-10">
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
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
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
      </StoreReveal>
    ) : null;

  /** TEMPLATE: dense-deal — flash banner top */
  const denseBanner =
    templateId === "dense-deal" ? (
      <div className="store-anim-fade-up store-delay-1 mb-4 rounded-xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 px-4 py-3 text-center text-sm font-extrabold text-white shadow-md sm:text-base">
        FLASH SALE · {proof.soldLabel}+ đã bán · Ưu đãi có hạn
      </div>
    ) : null;

  /** TEMPLATE: editorial-story — stacked gallery + fixed sidebar buy */
  const mainContent = (() => {
    if (templateId === "editorial-story") {
      return (
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start lg:gap-12">
          <div className="store-anim-slide-right store-delay-1">
            <ProductGallery
              {...galleryProps}
              layout="stacked"
              sticky={false}
            />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
              {buyPanel}
            </div>
          </div>
        </div>
      );
    }

    if (templateId === "minimal-gallery") {
      return (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:items-start lg:gap-12">
          <div className="store-anim-scale-in store-delay-1">
            <ProductGallery
              {...galleryProps}
              aspect="square"
              layout="mosaic-grid"
              sticky={false}
            />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-xl dark:border-stone-800 dark:bg-stone-900/95 sm:p-8">
              {buyPanel}
            </div>
          </div>
        </div>
      );
    }

    // bento-tech + dense-deal: classic 2-col
    return (
      <div
        className={`mt-6 grid gap-8 lg:gap-12 ${
          templateId === "dense-deal"
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:gap-16"
        }`}
      >
        <div className="store-anim-slide-right store-delay-1">
          <ProductGallery
            {...galleryProps}
            layout="thumbs"
            sticky
          />
        </div>
        {buyPanel}
      </div>
    );
  })();

  return (
    <StoreShell
      sellerId={sellerId}
      cover={cover}
      personalization={personalization}
    >
      <div
        className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:pb-16 lg:pt-2"
        data-pdp-template={templateId}
      >
        {breadcrumb}
        {denseBanner}
        {mainContent}
        <div className="mt-4">{tabs}</div>
        {relatedBlock}

        {/* Custom Builder Sections for Product Detail Page */}
        {pdpLayoutDoc.sections.length > 0 ? (
          <div className="mt-8 space-y-6">
            {pdpLayoutDoc.sections
              .filter((sec) => sec.enabled)
              .map((sec) => (
                <SectionRenderer
                  key={sec.id}
                  section={sec}
                  theme={{
                    primaryColor: shopConfig.primaryColor,
                    accentColor: shopConfig.accentColor,
                    backgroundColor: shopConfig.backgroundColor,
                    shopName: cover?.name || "Cửa hàng",
                  }}
                  products={related}
                />
              ))}
          </div>
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
