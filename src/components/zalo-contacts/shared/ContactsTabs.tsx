"use client";

import type { ContactsTab } from "@/types/zalo-contacts";

interface ContactsTabsProps {
  activeTab: ContactsTab;
  onChange: (tab: ContactsTab) => void;
}

const tabs: { id: ContactsTab; label: string }[] = [
  { id: "friends", label: "Bạn bè" },
  { id: "groups", label: "Nhóm" },
];

export default function ContactsTabs({
  activeTab,
  onChange,
}: ContactsTabsProps) {
  return (
    <div className="flex w-full rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50 sm:inline-flex sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none sm:px-4 sm:py-2 ${
            activeTab === tab.id
              ? "bg-white text-gray-800 shadow-theme-xs dark:bg-gray-900 dark:text-white/90"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}