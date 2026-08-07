import { buildStoreProductUrl } from "@/lib/shop-utils";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; idAcc: string; idCate: string }>;
}

/**
 * Legacy ZaloCN /showproduct/[seller]/[category]/[product]
 * (param names idAcc=category, idCate=product)
 */
export default async function LegacyShowProductPage({ params }: PageProps) {
  const { id, idAcc, idCate } = await params;
  redirect(buildStoreProductUrl(id, idCate, idAcc));
}
