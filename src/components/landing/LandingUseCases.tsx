"use client";

import { LANDING_USE_CASES } from "@/components/landing/landing-data";
import { LandingFeatureIcon } from "@/components/landing/LandingIcons";
import LandingReveal from "@/components/landing/LandingReveal";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const TONE_CLASSES = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
} as const;

export default function LandingUseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // GSAP 3D Cascade Entrance Animation cho Use Cases Cards
  useGSAP(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll<HTMLElement>(".use-case-card");
    
    // Tách riêng icon, khối Vấn đề, khối Giải pháp bên trong card để tạo nhịp stagger nội bộ
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 60%", // Kích hoạt khi Section trồi lên 60% viewport
        toggleActions: "play none none reverse",
      },
    });

    // 1. Animate các Card xuất hiện 3D + Blur
    tl.fromTo(
      cards,
      {
        y: 60,
        opacity: 0,
        scale: 0.9,
        rotationX: -15, // Góc nghiêng 3D
        filter: "blur(12px)",
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        rotationX: 0,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.12, // Lần lượt từng card
        ease: "power3.out",
      }
    );

    // 2. Animate khối "Vấn đề" và "Giải pháp" bên trong lướt nhẹ ra sau khi card hiện
    cards.forEach((card) => {
      const details = card.querySelectorAll(".card-detail-box");
      gsap.fromTo(
        details,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
          },
        }
      );
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="doi-tuong"
      className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-950 perspective-1000"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Đối tượng
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Giải pháp cho từng vai trò trong team
          </h2>
          <p className="landing-lead mt-3 text-base text-gray-600 dark:text-gray-400">
            Dù bạn là sale, marketing hay quản lý — CSKH tự động có workflow phù hợp.
          </p>
        </LandingReveal>

        <div ref={gridRef} className="mt-12 grid gap-6 sm:grid-cols-2">
          {LANDING_USE_CASES.map((item) => (
            <article
              key={item.title}
              className="use-case-card landing-card landing-card-pro p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-lg shadow-gray-200/40 dark:shadow-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-500/10 hover:border-brand-500/30 will-change-transform"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${TONE_CLASSES[item.tone]}`}
                >
                  <LandingFeatureIcon iconKey={item.iconKey} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="landing-title text-lg font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="landing-eyebrow text-xs font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {/* Khối Vấn đề */}
                <div className="card-detail-box rounded-xl bg-red-50/80 px-4 py-3 dark:bg-red-500/10 border border-red-100/80 dark:border-red-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 dark:text-red-400">
                    Vấn đề
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.pain}
                  </p>
                </div>

                {/* Khối CSKH Tự Động */}
                <div className="card-detail-box rounded-xl bg-emerald-50/80 px-4 py-3 dark:bg-emerald-500/10 border border-emerald-100/80 dark:border-emerald-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    CSKH tự động
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}