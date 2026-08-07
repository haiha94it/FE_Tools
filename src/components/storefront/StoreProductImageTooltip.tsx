"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { formatPriceRange, shopImageUrl } from "@/lib/shop-utils";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import React from "react";

interface StoreProductImageTooltipProps {
  product: ShopProduct;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
}

/**
 * Hiển thị ảnh preview lớn sắc nét + giá + tiêu đề khi người dùng hover vào sản phẩm.
 */
export default function StoreProductImageTooltip({
  product,
  children,
  side = "top",
  disabled = false,
}: StoreProductImageTooltipProps) {
  const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;

  if (disabled || !imageSrc) {
    return children;
  }

  const tooltipCard = (
    <div className="flex flex-col items-center gap-2 p-1.5 text-center">
      <div className="relative aspect-square h-56 w-56 overflow-hidden rounded-xl bg-white shadow-inner">
        <Image
          src={imageSrc}
          alt={product.title}
          fill
          className="object-contain p-2"
          unoptimized
          sizes="224px"
        />
      </div>
      <div className="max-w-[224px]">
        <p className="line-clamp-2 text-xs font-semibold text-white leading-snug">
          {product.title}
        </p>
        <p className="mt-1 text-xs font-bold text-pink-400">
          {formatPriceRange(product)}
        </p>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipCard} side={side} avoidCollisions>
      {children}
    </Tooltip>
  );
}
