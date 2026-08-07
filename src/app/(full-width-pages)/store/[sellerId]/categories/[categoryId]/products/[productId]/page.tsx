import { buildStoreProductUrl } from "@/lib/shop-utils";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    sellerId: string;
    categoryId: string;
    productId: string;
  }>;
}

/** Legacy long path → /store/{seller}/{category}/{product} */
export default async function LegacyStoreProductPage({ params }: PageProps) {
  const { sellerId, categoryId, productId } = await params;
  redirect(buildStoreProductUrl(sellerId, productId, categoryId));
}
