"use client";

import LandingAuthActions from "@/components/landing/LandingAuthActions";
import LandingHeroMockup from "@/components/landing/LandingHeroMockup";

import { IconCheck } from "@/components/landing/LandingIcons";
import LandingMarquee from "@/components/landing/LandingMarquee";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

const HERO_BULLETS = [
  "Tin nhắn Zalo realtime",
  "Chiến dịch marketing tự động",
  "Shop & quản lý đơn hàng",
] as const;

export default function LandingHero() {
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const mockupColRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!heroSectionRef.current || !heroContentRef.current || !textColRef.current) return;

    const badge = textColRef.current.querySelector(".hero-badge-item");
    const title = textColRef.current.querySelector(".hero-title-item");
    const lead = textColRef.current.querySelector(".hero-lead-item");
    const bullets = textColRef.current.querySelector(".hero-bullets-item");
    const actions = textColRef.current.querySelector(".hero-actions-item");

    const introTl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Badge Pulse
    if (badge) {
      introTl.fromTo(
        badge,
        { scale: 0.8, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }
      );
    }

    // Title Blur-in & Slide up
    if (title) {
      introTl.fromTo(
        title,
        { filter: "blur(12px)", y: 40, opacity: 0 },
        { filter: "blur(0px)", y: 0, opacity: 1, duration: 0.9 },
        "-=0.4"
      );
    }

    // Lead, bullets, actions lướt nối đuôi nhau
    const list = [lead, bullets, actions].filter(Boolean);
    if (list.length > 0) {
      introTl.fromTo(
        list,
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 },
        "-=0.6"
      );
    }

    // Mockup Reveal
    if (mockupColRef.current) {
      introTl.fromTo(
        mockupColRef.current,
        { opacity: 0, y: 40, scale: 0.96, filter: "blur(8px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out" },
        "-=0.8"
      );
    }
  }, { scope: heroSectionRef });

  return (
    <section
      ref={heroSectionRef}
      className="landing-gradient-hero relative z-0 min-h-screen overflow-hidden pt-20 pb-6 flex flex-col justify-between"
    >
      {/* Background Aurora Orbs */}
      <div className="landing-aurora-layer" aria-hidden>
        <div className="landing-aurora-orb landing-aurora-orb-1" />
        <div className="landing-aurora-orb landing-aurora-orb-2" />
        <div className="landing-aurora-orb landing-aurora-orb-3" />
        <div className="landing-grid-pattern" />
      </div>

      {/* Main Hero Content */}
      <div
        ref={heroContentRef}
        className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 w-full my-auto"
      >
        <div ref={textColRef} className="max-w-xl">
          <div className="hero-badge-item landing-badge-pulse mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur-sm dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <span className="landing-badge-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
            Nền tảng quản trị Zalo
          </div>

          <h1 className="hero-title-item landing-title text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Vận hành Zalo{" "}
            <span className="landing-gradient-text">thông minh</span> trên một bảng điều khiển
          </h1>

          <p className="hero-lead-item landing-lead mt-5 text-base leading-relaxed sm:text-lg">
            CSKH tự động giúp team sale và marketing quản lý tài khoản, chat khách, chạy chiến dịch và bán hàng — không cần chuyển đổi giữa nhiều công cụ.
          </p>

          <ul className="hero-bullets-item mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {HERO_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <IconCheck className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="hero-actions-item mt-7">
            <LandingAuthActions variant="hero" />
          </div>
        </div>

        <div ref={mockupColRef} className="relative w-full min-w-0 lg:pl-4">
          <LandingHeroMockup />
        </div>
      </div>

      {/* Landing Marquee tích hợp trực tiếp dưới chân Hero */}
      <div className="relative z-20 w-full mt-8 pt-4 border-t border-gray-200/40 dark:border-gray-800/40">
        <LandingMarquee />
      </div>
    </section>
  );
}