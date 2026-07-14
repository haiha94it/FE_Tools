import VideoCreatorPageClient from "@/components/zalo-video-creator/VideoCreatorPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng video | Chiến dịch Zalo",
  description: "Quản lý kênh Zalo Video — đăng video, phân tích, bình luận",
};

export default function PostVideoCampaignPage() {
  return <VideoCreatorPageClient />;
}