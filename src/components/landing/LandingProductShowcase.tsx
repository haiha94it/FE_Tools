"use client";

import {
  LANDING_SHOWCASE_TABS,
  type ShowcaseTabId,
} from "@/components/landing/landing-data";
import LandingShowcasePanels from "@/components/landing/LandingShowcasePanels";
import { IconCheck } from "@/components/landing/LandingIcons";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useRef, useState } from "react";

const TAB_IDS: ShowcaseTabId[] = ["messenger", "campaigns", "shop", "accounts"];

export default function LandingProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTabId>("messenger");
  const sectionRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);


  const tab = LANDING_SHOWCASE_TABS.find((t) => t.id === activeTab)!;

  // 1. TẠO CHUỖI SCROLLTIMELINE: Ghim trang + Cuộn hết các Tab mới cho đi tiếp
  useGSAP(() => {
    if (!sectionRef.current) return;

    const totalTabs = TAB_IDS.length;

    // Timeline chính để quản lý tiến trình cuộn của các Tab
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${totalTabs * 800}`,
        pin: true,
        pinSpacing: false, // Giữ stacking card effect — parent đã skip pin section này
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Tính tab active dựa trên tiến trình cuộn (progress 0 → 1)
          const rawIndex = Math.floor(self.progress * totalTabs);
          const index = Math.min(Math.max(rawIndex, 0), totalTabs - 1);
          const currentTab = TAB_IDS[index];

          setActiveTab((prev) => (prev !== currentTab ? currentTab : prev));
        },
      },
    });

    return () => {
      tl.kill();
    };
  }, { scope: sectionRef });

  // 2. Hiệu ứng chuyển text khi đổi tab — Panel do ShowcasePanels tự animate
  useGSAP(() => {
    if (!textContainerRef.current) return;

    gsap.fromTo(
      textContainerRef.current,
      { opacity: 0, y: 15, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }
    );
  }, [activeTab]);

  return (
    <div
      ref={sectionRef}
      id="san-pham"
      className="w-full min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-12 flex items-center justify-center overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Sản phẩm
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Xem giao diện thực tế từng module
          </h2>
          <p className="landing-lead mt-3 text-base text-gray-600 dark:text-gray-400">
            Cuộn chuột để lần lượt khám phá từng công cụ CSKH tự động Zalo.
          </p>
        </div>

        {/* Tab Selector Bar */}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5" role="tablist">
          {LANDING_SHOWCASE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                activeTab === t.id
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105"
                  : "border border-gray-200 bg-white/80 text-gray-600 hover:border-brand-200 hover:text-brand-600 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Grid: Text Description & Product Image Panel */}
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14 min-h-[420px]">
          {/* Cột trái: Văn bản */}
          <div ref={textContainerRef} className="will-change-transform">
            <h3 className="landing-title text-xl font-bold sm:text-2xl text-gray-900 dark:text-white">
              {tab.title}
            </h3>
            <p className="landing-lead mt-3 text-sm leading-relaxed sm:text-base text-gray-600 dark:text-gray-400">
              {tab.description}
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {tab.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 font-bold">
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Cột phải: Panel hình ảnh / Mockup */}
          <div className="landing-showcase-panel will-change-transform">
            <LandingShowcasePanels tabId={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}