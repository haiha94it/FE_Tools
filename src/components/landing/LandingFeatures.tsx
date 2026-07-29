"use client";

import { LANDING_FEATURES } from "@/components/landing/landing-data";
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
  info: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  neutral: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400",
} as const;

export default function LandingFeatures() {
  const gridRef = useRef<HTMLDivElement>(null);

  // GSAP Stagger Grid Entrance cho Feature Cards
  useGSAP(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll(".feature-card-item");
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, []);

  return (
    <section id="tinh-nang" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            Tính năng
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Mọi công cụ Zalo bạn cần — trong một nền tảng
          </h2>
          <p className="landing-lead mt-3 text-base">
            Thiết kế cho team vận hành thực tế: từ chat khách đến chiến dịch và bán hàng.
          </p>
        </LandingReveal>

        <div ref={gridRef} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className={`feature-card-item landing-card landing-card-pro group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 ${
                index === 0 ? "landing-card-featured sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${TONE_CLASSES[feature.tone]}`}
              >
                <LandingFeatureIcon iconKey={feature.iconKey} className="h-5 w-5" />
              </div>
              <h3 className="landing-title text-base font-semibold">{feature.title}</h3>
              <p className="landing-lead mt-2 text-sm leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}