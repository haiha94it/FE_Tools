import ResourceView from "@/components/resource";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tài nguyên | Zalo Admin",
  description: "Banner và sản phẩm ứng dụng — trung tâm tài nguyên Zalo",
};

export default function ResourcePage() {
  return <ResourceView />;
}