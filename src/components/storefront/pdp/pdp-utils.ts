import type { ShopProduct, ShopProductVariant } from "@/types/zalo-shop";

export function variantStock(variant: ShopProductVariant): number {
  const total = Number(variant.total_quantity);
  const sold = Number(variant.sold_quantity ?? 0);
  return Math.max(0, total - sold);
}

export function variantPrice(variant: ShopProductVariant) {
  const display = Number(variant.price);
  const list = variant.promotion_price ? Number(variant.promotion_price) : null;
  const hasDiscount = list != null && list > display;
  return {
    original: hasDiscount ? list! : display,
    display,
    hasDiscount,
    savings: hasDiscount ? list! - display : 0,
    discountPct:
      hasDiscount && list! > 0
        ? Math.round((1 - display / list!) * 100)
        : 0,
  };
}

/** Deterministic social proof from product id */
export function productSocialProof(product: ShopProduct) {
  const rating = (4.6 + (product.id % 4) * 0.1).toFixed(1);
  const reviews = 48 + (product.id * 17) % 280;
  const sold = 120 + (product.id * 41) % 3200;
  const soldLabel = sold >= 1000 ? `${(sold / 1000).toFixed(1)}k` : String(sold);
  return { rating: Number(rating), reviews, sold, soldLabel };
}

export function parseSpecsFromDescription(description?: string): {
  label: string;
  value: string;
}[] {
  if (!description) return [];
  const lines = description
    .replace(/<[^>]+>/g, "\n")
    .split(/\n|•|\|/)
    .map((l) => l.trim())
    .filter(Boolean);
  const specs: { label: string; value: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^([^:：-]{2,40})\s*[:：-]\s*(.+)$/);
    if (m) specs.push({ label: m[1].trim(), value: m[2].trim() });
    if (specs.length >= 8) break;
  }
  if (specs.length === 0) {
    return [
      { label: "Tình trạng", value: "Mới 100%" },
      { label: "Bảo hành", value: "12 tháng chính hãng" },
      { label: "Giao hàng", value: "Toàn quốc · COD" },
      { label: "Đổi trả", value: "7 ngày nếu lỗi NSX" },
    ];
  }
  return specs;
}
