"use client";

import ChatbotCard from "@/components/chatbot/ChatbotCard";
import ChatbotFormModal from "@/components/chatbot/ChatbotFormModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import type { ChatbotInstance } from "@/types/chatbot";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatbotsView() {
  const router = useRouter();
  const chatbots = useChatbotStore((s) => s.chatbots);
  const count = useChatbotStore((s) => s.count);
  const maxChatbots = useChatbotStore((s) => s.maxChatbots);
  const isLoading = useChatbotStore((s) => s.isLoading);
  const error = useChatbotStore((s) => s.error);
  const isSaving = useChatbotStore((s) => s.isSaving);
  const isCopying = useChatbotStore((s) => s.isCopying);

  const isCreateOpen = useChatbotStore((s) => s.isCreateOpen);
  const createName = useChatbotStore((s) => s.createName);
  const isCopyOpen = useChatbotStore((s) => s.isCopyOpen);
  const copyName = useChatbotStore((s) => s.copyName);

  const fetchChatbots = useChatbotStore((s) => s.fetchChatbots);
  const createChatbot = useChatbotStore((s) => s.createChatbot);
  const copyChatbot = useChatbotStore((s) => s.copyChatbot);
  const deleteChatbot = useChatbotStore((s) => s.deleteChatbot);
  const toggleActive = useChatbotStore((s) => s.toggleActive);
  const openCreate = useChatbotStore((s) => s.openCreate);
  const closeCreate = useChatbotStore((s) => s.closeCreate);
  const setCreateName = useChatbotStore((s) => s.setCreateName);
  const openCopy = useChatbotStore((s) => s.openCopy);
  const closeCopy = useChatbotStore((s) => s.closeCopy);
  const setCopyName = useChatbotStore((s) => s.setCopyName);

  useEffect(() => {
    void fetchChatbots();
  }, [fetchChatbots]);

  const atLimit = count >= maxChatbots;

  const handleDelete = async (chatbot: ChatbotInstance) => {
    const ok = await confirm({
      title: "Xóa kịch bản",
      message: `Bạn chắc chắn muốn xóa “${chatbot.name}”?`,
      description: "Toàn bộ Q&A, danh mục và cấu hình nhắc nhở sẽ bị xóa.",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    await deleteChatbot(chatbot.id);
  };

  const handleCreate = async () => {
    const id = await createChatbot();
    if (id != null) router.push(`/chatbots/${id}`);
  };

  const handleCopy = async () => {
    const id = await copyChatbot();
    if (id != null) router.push(`/chatbots/${id}`);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Chatbot AI" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quản lý kịch bản chatbot Zalo — huấn luyện Q&A, tình huống đặc biệt
            và nhắc nhở tự động.
          </p>
          <Badge size="sm" color="primary" variant="light">
            {count} / {maxChatbots} kịch bản
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          disabled={atLimit}
          className="shrink-0"
        >
          + Tạo kịch bản mới
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <Alert variant="error" title="Lỗi" message={error} />
        </div>
      ) : null}

      {atLimit ? (
        <div className="mb-4">
          <Alert
            variant="warning"
            title="Đã đạt giới hạn"
            message={`Mỗi tài khoản tối đa ${maxChatbots} kịch bản. Xóa bớt để tạo mới.`}
          />
        </div>
      ) : null}

      {isLoading && chatbots.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đang tải danh sách kịch bản…
          </p>
        </div>
      ) : null}

      {!isLoading && chatbots.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 text-center dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-base font-semibold text-gray-800 dark:text-white">
            Chưa có kịch bản nào
          </p>
          <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Tạo kịch bản đầu tiên để huấn luyện bot trả lời khách trên Zalo,
            gắn danh mục, ảnh và nhắc nhở tự động.
          </p>
          <Button size="sm" className="mt-5" onClick={openCreate}>
            + Tạo kịch bản đầu tiên
          </Button>
        </div>
      ) : null}

      {chatbots.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chatbots.map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              onCopy={openCopy}
              onDelete={handleDelete}
              onToggle={(item, next) => {
                void toggleActive(item.id, next);
              }}
            />
          ))}
        </div>
      ) : null}

      <ChatbotFormModal
        isOpen={isCreateOpen}
        title="Tạo kịch bản mới"
        description="Tối đa 10 kịch bản mỗi tài khoản."
        name={createName}
        isSaving={isSaving}
        confirmLabel="Tạo kịch bản"
        onNameChange={setCreateName}
        onClose={closeCreate}
        onSubmit={() => {
          void handleCreate();
        }}
      />

      <ChatbotFormModal
        isOpen={isCopyOpen}
        title="Sao chép kịch bản"
        description="Sao chép danh mục, Q&A và ảnh. Tài khoản Zalo cần gán lại."
        name={copyName}
        isSaving={isCopying}
        confirmLabel="Sao chép"
        onNameChange={setCopyName}
        onClose={closeCopy}
        onSubmit={() => {
          void handleCopy();
        }}
      />
    </div>
  );
}
