import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; idCate: string }>;
}

/** Legacy ZaloCN /shoplinkhome/[id]/[idCate] → /store/[sellerId]/categories/[categoryId] */
export default async function LegacyShopLinkCategoryPage({ params }: PageProps) {
  const { id, idCate } = await params;
  redirect(`/store/${id}/categories/${idCate}`);
}