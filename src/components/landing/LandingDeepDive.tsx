"use client";

import { LANDING_DEEP_DIVES } from "@/components/landing/landing-data";
import { IconCheck } from "@/components/landing/LandingIcons";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import Image from "next/image";
import { useRef } from "react";

const BADGE_TONE = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  purple:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
} as const;

export default function LandingDeepDive() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const rows = sectionRef.current.querySelectorAll<HTMLElement>(".deep-dive-row");

    rows.forEach((row) => {
      const textCol = row.querySelector(".deep-dive-text");
      const imgCol = row.querySelector(".deep-dive-img");
      const isReverse = row.classList.contains("is-reverse");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 80%", // Kích hoạt khi từng row xuất hiện 80% viewport
          toggleActions: "play none none reverse",
        },
      });

      if (textCol) {
        tl.fromTo(
          textCol,
          { x: isReverse ? 40 : -40, opacity: 0, filter: "blur(8px)" },
          { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
        );
      }

      if (imgCol) {
        tl.fromTo(
          imgCol,
          { x: isReverse ? -40 : 40, opacity: 0, scale: 0.94, filter: "blur(8px)" },
          { x: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: "power3.out" },
          "-=0.6"
        );
      }
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="chi-tiet" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Chi tiết
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-gray-900 dark:text-white">
            Đi sâu vào từng module cốt lõi
          </h2>
          <p className="landing-lead mt-3 text-base text-gray-600 dark:text-gray-400">
            Mỗi tính năng được thiết kế tỉ mỉ để tối ưu hiệu suất cho team của bạn.
          </p>
        </div>

        <div className="mt-16 space-y-20 sm:space-y-28">
          {LANDING_DEEP_DIVES.map((item) => (
            <div
              key={item.id}
              className={`deep-dive-row flex flex-col items-center gap-10 lg:flex-row lg:gap-16 ${
                item.reverse ? "is-reverse lg:flex-row-reverse" : ""
              }`}
            >
              {/* Cột chữ */}
              <div className="deep-dive-text w-full lg:w-1/2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${BADGE_TONE[item.tone]}`}>
                  {item.badge}
                </span>
                <h3 className="landing-title mt-3 text-xl font-bold leading-snug sm:text-2xl text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="landing-lead mt-3 text-sm leading-relaxed sm:text-base text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 font-bold">
                        <IconCheck className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột ảnh mockup */}
              <div className="deep-dive-img w-full lg:w-1/2">
                <div className="landing-card overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/40">
                  <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}