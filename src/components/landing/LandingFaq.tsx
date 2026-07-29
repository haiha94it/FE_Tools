"use client";

import { LANDING_FAQ } from "@/components/landing/landing-data";
import LandingReveal from "@/components/landing/LandingReveal";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useRef, useState } from "react";

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // GSAP Stagger Entrance cho các câu hỏi FAQ
  useGSAP(() => {
    if (!listRef.current) return;

    const items = listRef.current.children;
    gsap.fromTo(
      items,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="faq" className="landing-section-alt py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">FAQ</p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Câu hỏi thường gặp
          </h2>
          <p className="landing-lead mt-3 text-base">
            Giải đáp nhanh trước khi bạn bắt đầu dùng thử.
          </p>
        </LandingReveal>

        <div ref={listRef} className="mt-10 space-y-3.5">
          {LANDING_FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className="landing-card overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200/80 dark:border-gray-800"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4.5 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="landing-title text-sm font-semibold sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-transform duration-300 dark:border-gray-700 dark:text-gray-400 ${
                      isOpen ? "rotate-180 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300" : ""
                    }`}
                    aria-hidden
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="landing-lead border-t border-gray-100 px-5 pb-4 pt-2.5 text-sm leading-relaxed dark:border-gray-800">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}