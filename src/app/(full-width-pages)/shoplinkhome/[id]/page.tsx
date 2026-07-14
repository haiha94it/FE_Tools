import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Legacy ZaloCN /shoplinkhome/[id] → /store/[sellerId] */
export default async function LegacyShopLinkHomePage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/store/${id}`);
}