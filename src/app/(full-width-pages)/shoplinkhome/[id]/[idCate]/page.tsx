import { buildStoreCategoryUrl } from "@/lib/shop-utils";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; idCate: string }>;
}

/** Legacy ZaloCN /shoplinkhome/[id]/[idCate] → /store/{seller}/{category} */
export default async function LegacyShopLinkCategoryPage({ params }: PageProps) {
  const { id, idCate } = await params;
  redirect(buildStoreCategoryUrl(id, idCate));
}
