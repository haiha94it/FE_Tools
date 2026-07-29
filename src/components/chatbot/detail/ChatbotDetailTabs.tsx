"use client";

import type { ChatbotDetailTab } from "@/types/chatbot";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => checkScroll());
      observer.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      observer?.disconnect();
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -160 : 160;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center w-full group">
      {/* Nút lùi bên trái */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="absolute left-1 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
          aria-label="Cuộn sang trái"
        >
          <FiChevronLeft size={16} />
        </button>
      )}

      {/* Container cuộn ngang */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-none w-full"
      >
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
                className={`cursor-pointer shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white text-brand-600 shadow-xs dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Nút tiến bên phải */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="absolute right-1 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
          aria-label="Cuộn sang phải"
        >
          <FiChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
