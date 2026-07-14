import GuidesView from "@/components/guides";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hướng dẫn | Zalo Admin",
  description: "Video hướng dẫn sử dụng tính năng Zalo Admin",
};

export default function GuidesPage() {
  return <GuidesView />;
}