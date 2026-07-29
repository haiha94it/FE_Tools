"use client";

import { useCallback, useRef, useState } from "react";

export default function LandingHeroMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg)");

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt(
      `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`,
    );
  }, []);

  const handleLeave = useCallback(() => {
    setTilt("perspective(1200px) rotateX(0deg) rotateY(0deg)");
  }, []);

  return (
    <div
      ref={wrapRef}
      className="landing-mockup-wrap landing-hero-enter landing-hero-enter-6 mx-auto w-full max-w-xl lg:max-w-none"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="landing-mockup-glow" aria-hidden />
      <div className="landing-mockup-float">
        <div className="landing-mockup-tilt" style={{ transform: tilt }}>
          <div
            className="landing-card landing-mockup-shell relative overflow-hidden shadow-2xl shadow-brand-500/15 dark:shadow-black/40"
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
    </div>
  );
}