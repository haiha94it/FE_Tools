import ChatbotDetailView from "@/components/chatbot/detail";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: pageTitle("Chi tiết kịch bản chatbot"),
  description: "Cấu hình Q&A, danh mục, nhắc nhở và gán tài khoản Zalo.",
};

interface ChatbotDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatbotDetailPage({
  params,
}: ChatbotDetailPageProps) {
  const { id } = await params;
  const chatbotId = Number(id);

  if (!Number.isFinite(chatbotId) || chatbotId <= 0) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-300">
        ID kịch bản không hợp lệ.
      </div>
    );
  }

  return <ChatbotDetailView chatbotId={chatbotId} />;
}
