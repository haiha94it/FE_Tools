"use client";

import ChatbotFormModal from "@/components/chatbot/ChatbotFormModal";
import CategoryPanel from "@/components/chatbot/detail/CategoryPanel";
import ChatbotDetailTabs from "@/components/chatbot/detail/ChatbotDetailTabs";
import ImagesPanel from "@/components/chatbot/detail/ImagesPanel";
import ReminderPanel from "@/components/chatbot/detail/ReminderPanel";
import SettingsPanel from "@/components/chatbot/detail/SettingsPanel";
import SpecialCasePanel from "@/components/chatbot/detail/SpecialCasePanel";
import TrainingPanel from "@/components/chatbot/detail/TrainingPanel";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ChatbotDetailViewProps {
  chatbotId: number;
}

export default function ChatbotDetailView({
  chatbotId,
}: ChatbotDetailViewProps) {
  const router = useRouter();
  const chatbot = useChatbotStore((s) => s.selectedChatbot);
  const isDetailLoading = useChatbotStore((s) => s.isDetailLoading);
  const error = useChatbotStore((s) => s.error);
  const detailTab = useChatbotStore((s) => s.detailTab);
  const setDetailTab = useChatbotStore((s) => s.setDetailTab);
  const fetchChatbotDetail = useChatbotStore((s) => s.fetchChatbotDetail);
  const fetchChatbots = useChatbotStore((s) => s.fetchChatbots);

  const isCopyOpen = useChatbotStore((s) => s.isCopyOpen);
  const copyName = useChatbotStore((s) => s.copyName);
  const isCopying = useChatbotStore((s) => s.isCopying);
  const setCopyName = useChatbotStore((s) => s.setCopyName);
  const closeCopy = useChatbotStore((s) => s.closeCopy);
  const copyChatbot = useChatbotStore((s) => s.copyChatbot);

  useEffect(() => {
    void fetchChatbotDetail(chatbotId);
    void fetchChatbots({ silent: true });
  }, [chatbotId, fetchChatbotDetail, fetchChatbots]);

  if (isDetailLoading && !chatbot) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <p className="text-sm text-gray-500">Đang tải kịch bản…</p>
      </div>
    );
  }

  if (!chatbot || chatbot.id !== chatbotId) {
    return (
      <div className="space-y-4">
        <PageBreadcrumb
          pageTitle="Kịch bản không tồn tại"
          parents={[{ label: "Chatbot AI", href: "/chatbots" }]}
          backHref="/chatbots"
          backLabel="Danh sách kịch bản"
        />
        <Alert
          variant="error"
          title="Không tìm thấy"
          message={error || "Kịch bản không tồn tại hoặc đã bị xóa."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        pageTitle={chatbot.name}
        parents={[{ label: "Chatbot AI", href: "/chatbots" }]}
        backHref="/chatbots"
        backLabel="Danh sách kịch bản"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          size="sm"
          color={chatbot.is_active ? "success" : "light"}
          variant="light"
        >
          {chatbot.is_active ? "Đang bật" : "Tắt"}
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ID #{chatbot.id}
        </span>
      </div>

      {error ? (
        <Alert variant="error" title="Lỗi" message={error} />
      ) : null}

      <ChatbotDetailTabs active={detailTab} onChange={setDetailTab} />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.02]">
        {detailTab === "training" ? (
          <TrainingPanel chatbotId={chatbotId} />
        ) : null}
        {detailTab === "categories" ? (
          <CategoryPanel chatbotId={chatbotId} />
        ) : null}
        {detailTab === "images" ? <ImagesPanel chatbotId={chatbotId} /> : null}
        {detailTab === "special-cases" ? (
          <SpecialCasePanel chatbotId={chatbotId} />
        ) : null}
        {detailTab === "reminders" ? (
          <ReminderPanel chatbotId={chatbotId} />
        ) : null}
        {detailTab === "settings" ? (
          <SettingsPanel chatbot={chatbot} />
        ) : null}
      </div>

      <ChatbotFormModal
        isOpen={isCopyOpen}
        title="Sao chép kịch bản"
        description="Sao chép danh mục, Q&A và ảnh. Tài khoản Zalo cần gán lại."
        name={copyName}
        isSaving={isCopying}
        confirmLabel="Sao chép"
        onNameChange={setCopyName}
        onClose={closeCopy}
        onSubmit={async () => {
          const id = await copyChatbot();
          if (id != null) router.push(`/chatbots/${id}`);
        }}
      />
    </div>
  );
}
