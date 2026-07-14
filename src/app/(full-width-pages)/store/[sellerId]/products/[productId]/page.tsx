import { buildStoreProductUrl } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ sellerId: string; productId: string }>;
}

/** Short link /store/[sellerId]/products/[productId] → canonical category URL */
export default async function StoreProductShortLinkPage({ params }: PageProps) {
  const { sellerId, productId } = await params;
  const product = await zaloShopService.findProductById(sellerId, productId);

  if (!product?.category) {
    redirect(`/store/${sellerId}`);
  }

  redirect(buildStoreProductUrl(sellerId, product.id, product.category));
}