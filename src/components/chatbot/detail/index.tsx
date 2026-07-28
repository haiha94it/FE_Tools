"use client";

import ChatbotFormModal from "@/components/chatbot/ChatbotFormModal";
import ChatTestBot from "@/components/chatbot/ChatTestBot";
import CategoryPanel from "@/components/chatbot/detail/CategoryPanel";
import ChatbotDetailTabs from "@/components/chatbot/detail/ChatbotDetailTabs";
import ImagesPanel from "@/components/chatbot/detail/ImagesPanel";
import ReminderPanel from "@/components/chatbot/detail/ReminderPanel";
import SpecialCasePanel from "@/components/chatbot/detail/SpecialCasePanel";
import TrainingPanel from "@/components/chatbot/detail/TrainingPanel";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import { confirm } from "@/lib/confirm";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import type { ChatbotInstance } from "@/types/chatbot";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCopy, FiCpu, FiPlus, FiTrash2 } from "react-icons/fi";
import AssignAccountsModal from "./AssignAccountsModal";
import MissDataNotificationModal from "./MissDataNotificationModal";

interface ChatbotDetailViewProps {
  chatbotId: number;
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "vừa xong";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  } catch (e) {
    return "vừa xong";
  }
};

export default function ChatbotDetailView({
  chatbotId,
}: ChatbotDetailViewProps) {
  const router = useRouter();
  
  // Chatbots list & states
  const chatbots = useChatbotStore((s) => s.chatbots);
  const count = useChatbotStore((s) => s.count);
  const maxChatbots = useChatbotStore((s) => s.maxChatbots);
  const isDetailLoading = useChatbotStore((s) => s.isDetailLoading);
  const error = useChatbotStore((s) => s.error);
  const detailTab = useChatbotStore((s) => s.detailTab);
  const setDetailTab = useChatbotStore((s) => s.setDetailTab);
  const fetchChatbotDetail = useChatbotStore((s) => s.fetchChatbotDetail);
  const fetchChatbots = useChatbotStore((s) => s.fetchChatbots);
  
  // CRUD Actions
  const chatbot = useChatbotStore((s) => s.selectedChatbot);
  const isSaving = useChatbotStore((s) => s.isSaving);
  const isCopying = useChatbotStore((s) => s.isCopying);
  const toggleActive = useChatbotStore((s) => s.toggleActive);
  const deleteChatbot = useChatbotStore((s) => s.deleteChatbot);
  
  // Create Modal states
  const isCreateOpen = useChatbotStore((s) => s.isCreateOpen);
  const createName = useChatbotStore((s) => s.createName);
  const openCreate = useChatbotStore((s) => s.openCreate);
  const closeCreate = useChatbotStore((s) => s.closeCreate);
  const setCreateName = useChatbotStore((s) => s.setCreateName);
  const createChatbot = useChatbotStore((s) => s.createChatbot);

  // Copy Modal states
  const isCopyOpen = useChatbotStore((s) => s.isCopyOpen);
  const copyName = useChatbotStore((s) => s.copyName);
  const openCopy = useChatbotStore((s) => s.openCopy);
  const closeCopy = useChatbotStore((s) => s.closeCopy);
  const setCopyName = useChatbotStore((s) => s.setCopyName);
  const copyChatbot = useChatbotStore((s) => s.copyChatbot);

  // Assign Accounts Modal states
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignBot, setAssignBot] = useState<ChatbotInstance | null>(null);

  const openAssign = (bot: ChatbotInstance) => {
    setAssignBot(bot);
    setIsAssignOpen(true);
  };
  const closeAssign = () => {
    setIsAssignOpen(false);
    setAssignBot(null);
  };

  // Miss Data Config Modal states
  const [isMissDataOpen, setIsMissDataOpen] = useState(false);
  const [missDataBot, setMissDataBot] = useState<ChatbotInstance | null>(null);

  const openMissData = (bot: ChatbotInstance) => {
    setMissDataBot(bot);
    setIsMissDataOpen(true);
  };
  const closeMissData = () => {
    setIsMissDataOpen(false);
    setMissDataBot(null);
  };


  useEffect(() => {
    void fetchChatbotDetail(chatbotId);
    void fetchChatbots({ silent: true });
  }, [chatbotId, fetchChatbotDetail, fetchChatbots]);

  const atLimit = count >= maxChatbots;

  const handleCreate = async () => {
    const id = await createChatbot();
    if (id != null) router.push(`/chatbots/${id}`);
  };

  const handleCopy = async () => {
    const id = await copyChatbot();
    if (id != null) router.push(`/chatbots/${id}`);
  };

  const handleDelete = async (targetBot: ChatbotInstance) => {
    const ok = await confirm({
      title: "Xóa kịch bản",
      message: `Bạn chắc chắn muốn xóa kịch bản “${targetBot.name}”?`,
      description: "Toàn bộ Q&A, danh mục và cấu hình nhắc nhở sẽ bị xóa vĩnh viễn.",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    
    const success = await deleteChatbot(targetBot.id);
    if (success) {
      router.push("/chatbots");
    }
  };

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
        pageTitle="Kiểm thử & Huấn luyện"
        parents={[{ label: "Chatbot AI", href: "/chatbots" }]}
      />

      {error ? (
        <Alert variant="error" title="Lỗi" message={error} />
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch">
        {/* Cột 1: Danh sách kịch bản (Sidebar) */}
        <div className="xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02] flex flex-col xl:h-[calc(100vh-210px)] w-full">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800 mb-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Kịch bản Zalo
                </h3>
                <p className="text-[11px] text-gray-500">
                  Sử dụng {count}/{maxChatbots}
                </p>
              </div>
              <Button
                size="sm"
                onClick={openCreate}
                disabled={atLimit}
                className="!px-2.5 !py-1 !text-xs flex items-center gap-1 shrink-0"
              >
                <FiPlus size={12} /> Kịch bản
              </Button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {chatbots.map((bot) => {
                const isActiveBot = bot.id === chatbotId;
                const trainingDataCount = bot.training_data?.length ?? 0;
                const accountsCount = bot.zalo_account_keys?.length ?? 0;
                
                return (
                  <div
                    key={bot.id}
                    onClick={() => {
                      if (!isActiveBot) {
                        router.push(`/chatbots/${bot.id}`);
                      }
                    }}
                    className={`group relative flex flex-col gap-2 rounded-xl p-3.5 border cursor-pointer transition duration-150 ${
                      isActiveBot
                        ? "border-brand-500 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/5 shadow-xs"
                        : "border-gray-150 bg-gray-50/20 hover:border-gray-300 dark:border-gray-800 dark:bg-transparent dark:hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isActiveBot
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <FiCpu size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-gray-900 dark:text-white mb-0.5">
                            {bot.name}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            {trainingDataCount} Q&A • {accountsCount} Zalo
                          </span>
                        </div>
                      </div>
                      
                      {/* Active Switch */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="scale-80 origin-right shrink-0"
                      >
                        <Switch
                          checked={bot.is_active}
                          onChange={(checked) => {
                            void toggleActive(bot.id, checked);
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 dark:text-gray-500 pt-1.5 border-t border-gray-100/50 dark:border-gray-800/50">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${bot.is_active ? "bg-success-500" : "bg-gray-300"}`}></span>
                        {/* <span>ID #{bot.id}</span> */}
                         <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAssign(bot);
                          }}
                          className="ml-1.5 cursor-pointer font-bold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          [Gán tài khoản]
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMissData(bot);
                          }}
                          className="ml-1.5 cursor-pointer font-bold text-amber-600 hover:text-amber-700 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
                        >
                          [Báo thiếu data]
                        </button>

                      </div>
                      <span>Cập nhật {formatRelativeTime(bot.updated_at)}</span>
                      
                      {/* Inline Actions on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition duration-150 absolute right-3 bottom-2 bg-white px-1.5 py-0.5 rounded-md dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCopy(bot);
                          }}
                          className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition"
                          title="Sao chép kịch bản"
                        >
                          <FiCopy size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(bot);
                          }}
                          className="text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 transition"
                          title="Xóa kịch bản"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cột 2: Khung chat test bot */}
        <div className="xl:col-span-4 xl:h-[calc(100vh-210px)] flex flex-col">
          <ChatTestBot chatbotId={chatbotId} />
        </div>

        {/* Cột 3: Panel Huấn luyện & Cấu hình */}
        <div className="xl:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-white/[0.02] flex flex-col xl:h-[calc(100vh-210px)]">
            <div className="shrink-0">
              <ChatbotDetailTabs active={detailTab} onChange={setDetailTab} />
            </div>
            
            <div className="mt-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {detailTab === "training" ? (
                <TrainingPanel chatbotId={chatbotId} />
              ) : null}
              {detailTab === "categories" ? (
                <CategoryPanel chatbotId={chatbotId} />
              ) : null}
              {detailTab === "images" ? (
                <ImagesPanel chatbotId={chatbotId} />
              ) : null}
              {detailTab === "special-cases" ? (
                <SpecialCasePanel chatbotId={chatbotId} />
              ) : null}
              {detailTab === "reminders" ? (
                <ReminderPanel chatbotId={chatbotId} />
              ) : null}
            </div>
          </div>
        </div>
      </div>

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

       <AssignAccountsModal
        isOpen={isAssignOpen}
        onClose={closeAssign}
        chatbot={assignBot}
      />

      <MissDataNotificationModal
        isOpen={isMissDataOpen}
        onClose={closeMissData}
        chatbot={missDataBot}
      />
    </div>
  );
}
