import StorefrontHome from "@/components/storefront";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cửa hàng trực tuyến",
  description: "Mua sắm trực tuyến — sản phẩm chất lượng, giao hàng tận nơi",
};

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

export default async function StorePage({ params }: PageProps) {
  const { sellerId } = await params;
  return <StorefrontHome sellerId={sellerId} />;
}