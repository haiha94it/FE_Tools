"use client";

import LandingComparison from "@/components/landing/LandingComparison";
import LandingCta from "@/components/landing/LandingCta";
import LandingDeepDive from "@/components/landing/LandingDeepDive";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingNav from "@/components/landing/LandingNav";
import LandingProductShowcase from "@/components/landing/LandingProductShowcase";
import LandingStats from "@/components/landing/LandingStats";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingUseCases from "@/components/landing/LandingUseCases";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const targets = gsap.utils.toArray<HTMLElement>(".gsap-pin-target");

    targets.forEach((target, index) => {
      const isFaqSection = target.classList.contains("faq-stack-target");
      const isShowcaseSection = target.classList.contains("showcase-stack-target");
      const isLastSection = index === targets.length - 1;

      // Đặt quãng đường cuộn: Showcase cần dài nhất (+=350%) để cuộn hết 4 tabs
      let scrollLength = "+=280%";
      if (isFaqSection) scrollLength = "+=150%";
      if (isShowcaseSection) scrollLength = "+=350%";

      // 1. Cố định Section khi cuộn tới
      ScrollTrigger.create({
        trigger: target,
        start: "top top",
        end: scrollLength,
        pin: true,
        pinSpacing: isFaqSection ? true : false,
        scrub: 1.5,
      });

      // 2. TẠO CHIỀU SÂU: Section cũ chui về sau & mờ đi khi Section tiếp theo trồi lên đè lên nó
      if (!isLastSection) {
        gsap.to(target, {
          scale: 0.94,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: targets[index + 1],
            start: "top bottom",
            end: "top top",
            scrub: 1.5,
          },
        });
      }
    });
  }, { scope: containerRef });

  return (
    <>
      <LandingNav />
      <div ref={containerRef} className="relative z-0 overflow-x-hidden bg-gray-100 dark:bg-gray-950">
        {/* 1. Hero Section */}
        <div className="gsap-pin-target relative z-0 origin-top bg-white dark:bg-gray-950">
          <LandingHero />
        </div>

        {/* 2. LandingStats */}
        <div className="gsap-pin-target relative z-10 origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingStats />
        </div>

        {/* 3. LandingProductShowcase (Có class showcase-stack-target để giữ lâu hơn) */}
        <div className="gsap-pin-target showcase-stack-target relative z-20 origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingProductShowcase />
        </div>

        {/* 4. LandingUseCases (Sẽ trồi lên đè qua ProductShowcase sau khi cuộn hết 4 tab) */}
        <div className="gsap-pin-target relative z-30 origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingUseCases />
        </div>

        {/* 5. LandingFeatures */}
        <div className="gsap-pin-target relative z-40 origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingFeatures />
        </div>

        {/* 6. Deep Dive */}
        <div className="gsap-pin-target relative z-50 origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingDeepDive />
        </div>

        {/* 7. Comparison */}
        <div className="gsap-pin-target relative z-[60] origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingComparison />
        </div>

        {/* 8. How It Works */}
        <div className="gsap-pin-target relative z-[70] origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingHowItWorks />
        </div>

        {/* 9. Testimonials */}
        <div className="gsap-pin-target relative z-[80] origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingTestimonials />
        </div>

        {/* 10. FAQ */}
        <div className="gsap-pin-target faq-stack-target relative z-[90] origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingFaq />
        </div>

        {/* 11. CTA */}
        <div className="gsap-pin-target relative z-[100] origin-top bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800/60 shadow-2xl">
          <LandingCta />
        </div>
      </div>
      <LandingFooter />
    </>
  );
}