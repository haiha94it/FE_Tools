import ChatbotsView from "@/components/chatbot";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: pageTitle("Chatbot AI"),
  description:
    "Quản lý kịch bản chatbot Zalo — huấn luyện Q&A, danh mục, nhắc nhở tự động.",
};

export default function ChatbotsPage() {
  return <ChatbotsView />;
}
