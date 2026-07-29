"use client";

import {
  LANDING_SHOWCASE_TABS,
  type ShowcaseTabId,
} from "@/components/landing/landing-data";
import LandingReveal from "@/components/landing/LandingReveal";
import LandingShowcasePanels from "@/components/landing/LandingShowcasePanels";
import { IconCheck } from "@/components/landing/LandingIcons";
import { useState } from "react";

export default function LandingProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTabId>("messenger");
  const tab = LANDING_SHOWCASE_TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="san-pham" className="landing-section py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            Sản phẩm
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Xem giao diện thực tế từng module
          </h2>
          <p className="landing-lead mt-3 text-base">
            Chọn module để xem preview — mỗi phần là một công cụ hoàn chỉnh trong CSKH tự động.
          </p>
        </LandingReveal>

        <LandingReveal className="mt-10" variant="up" delay={80}>
          <div
            className="flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label="Module sản phẩm"
          >
            {LANDING_SHOWCASE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                aria-controls={`showcase-panel-${t.id}`}
                className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300"
                }`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </LandingReveal>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <LandingReveal variant="left" delay={120}>
            <div>
              <h3 className="landing-title text-xl font-bold sm:text-2xl">{tab.title}</h3>
              <p className="landing-lead mt-3 text-sm leading-relaxed sm:text-base">
                {tab.description}
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {tab.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      <IconCheck className="h-3 w-3" />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </LandingReveal>

          <LandingReveal variant="right" delay={160}>
            <div
              id={`showcase-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={activeTab}
              className="landing-showcase-panel"
            >
              <LandingShowcasePanels tabId={activeTab} />
            </div>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}