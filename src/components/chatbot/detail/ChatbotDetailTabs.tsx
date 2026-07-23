"use client";

import type { ChatbotDetailTab } from "@/types/chatbot";

const TABS: Array<{ id: ChatbotDetailTab; label: string }> = [
  { id: "training", label: "Dữ liệu huấn luyện" },
  { id: "categories", label: "Danh mục" },
  { id: "images", label: "Thư viện ảnh" },
  { id: "special-cases", label: "Tình huống đặc biệt" },
  { id: "reminders", label: "Nhắc nhở" },
];

interface ChatbotDetailTabsProps {
  active: ChatbotDetailTab;
  onChange: (tab: ChatbotDetailTab) => void;
}

export default function ChatbotDetailTabs({
  active,
  onChange,
}: ChatbotDetailTabsProps) {
  return (
    <div className="relative w-full">
      <div className="overflow-x-auto scrollbar-none pr-8">
        <nav
          className="flex min-w-max gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-white/[0.03]"
          aria-label="Tab kịch bản chatbot"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {/* Mờ gradient ở mép phải khi tràn tab */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" />
    </div>
  );
}
