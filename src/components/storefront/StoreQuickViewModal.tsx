"use client";

import ProductBuyPanel from "@/components/storefront/ProductBuyPanel";
import ProductGallery from "@/components/storefront/ProductGallery";
import { Modal } from "@/components/ui/modal";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopProduct, ShopProductVariant } from "@/types/zalo-shop";
import { useState } from "react";

interface StoreQuickViewModalProps {
  product: ShopProduct | null;
  sellerId: string;
  onClose: () => void;
}

export default function StoreQuickViewModal({
  product,
  sellerId,
  onClose,
}: StoreQuickViewModalProps) {
  const addToCart = useShopCartStore((s) => s.addToCart);
  const openCheckout = useShopCartStore((s) => s.openCheckout);
  const isLoading = useShopCartStore((s) => s.isLoading);

  const [userSelectedVariant, setUserSelectedVariant] =
    useState<ShopProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const selectedVariant = userSelectedVariant ?? product.variants[0] ?? null;

  const maxQty = selectedVariant
    ? Math.max(
        0,
        Number(selectedVariant.total_quantity) -
          Number(selectedVariant.sold_quantity ?? 0),
      )
    : 99;

  const handlePurchase = async (isBuyNow: boolean) => {
    if (!selectedVariant?.id) return;
    try {
      await addToCart({
        id_employee: Number(sellerId),
        options: [{ id_variant: selectedVariant.id, quantity }],
      });
      toast.success(
        isBuyNow
          ? "Đang chuyển đến trang thanh toán"
          : "Đã thêm vào giỏ hàng!",
      );
      onClose();
      if (isBuyNow) {
        openCheckout();
      }
    } catch {
      toast.error("Không thể xử lý yêu cầu. Vui lòng thử lại!");
    }
  };

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      layer="top"
      showCloseButton={false}
      className="max-w-4xl overflow-y-auto rounded-3xl border border-stone-200/90 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-stone-900 sm:p-7"
    >
      <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase text-stone-950">
            ⚡ Xem nhanh sản phẩm
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            ⭐ 100% Chính Hãng
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ProductGallery
            images={product.images.map(shopImageUrl)}
            title={product.title}
            product={product}
            sticky={false}
          />
        </div>
        <div className="lg:col-span-6">
          <ProductBuyPanel
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setUserSelectedVariant}
            quantity={quantity}
            onQuantityChange={setQuantity}
            maxQty={maxQty}
            isLoading={isLoading}
            onAddToCart={() => void handlePurchase(false)}
            onBuyNow={() => void handlePurchase(true)}
          />
        </div>
      </div>
    </Modal>
  );
}
