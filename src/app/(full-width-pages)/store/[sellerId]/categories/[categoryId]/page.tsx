import { buildStoreCategoryUrl } from "@/lib/shop-utils";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ sellerId: string; categoryId: string }>;
}

/** Legacy: /store/.../categories/... → /store/{seller}/{category} */
export default async function LegacyStoreCategoryPage({ params }: PageProps) {
  const { sellerId, categoryId } = await params;
  redirect(buildStoreCategoryUrl(sellerId, categoryId));
}
