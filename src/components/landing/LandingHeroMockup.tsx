"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

export default function LandingHeroMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance 3D & Continuous Floating Animation
  useGSAP(() => {
    if (!wrapRef.current || !cardRef.current) return;

    // 1. Interactive Entrance Animation
    gsap.fromTo(
      cardRef.current,
      { scale: 0.88, rotateX: 12, rotateY: -8, y: 40, opacity: 0 },
      {
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        y: 0,
        opacity: 1,
        duration: 1,
        delay: 0.2,
        ease: "back.out(1.4)",
      }
    );

    // 2. Continuous 3D Floating Effect
    if (floatRef.current) {
      gsap.to(floatRef.current, {
        y: -12,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  // GSAP Smooth 3D Mouse Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current || !cardRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(cardRef.current, {
      rotateY: x * 12,
      rotateX: -y * 12,
      duration: 0.35,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={wrapRef}
      className="landing-mockup-wrap mx-auto w-full max-w-xl lg:max-w-none [perspective:1200px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="landing-mockup-glow" aria-hidden />
      <div ref={floatRef} className="landing-mockup-float [transform-style:preserve-3d]">
        <div
          ref={cardRef}
          className="landing-card landing-mockup-shell relative overflow-hidden shadow-2xl shadow-brand-500/15 dark:shadow-black/40 [transform-style:preserve-3d]"
          role="img"
          aria-label="Xem trước giao diện bảng điều khiển CSKH tự động"
        >
          <div className="landing-mockup-shine" aria-hidden />

          <div className="landing-mockup-chrome flex items-center gap-2 px-4 py-3 backdrop-blur-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="landing-lead ml-2 text-xs font-medium">cskh.tudongai.com</span>
          </div>

          <div className="overflow-hidden bg-gray-950/5">
            <img
              src="/images/logo/mockup 0.png"
              alt="Bảng điều khiển CSKH tự động"
              className="w-full h-auto object-cover transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}