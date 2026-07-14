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
            aria-label="Xem trước giao diện bảng điều khiển CAREVIPPRO"
          >
            <div className="landing-mockup-shine" aria-hidden />

            <div className="landing-mockup-chrome flex items-center gap-2 px-4 py-3 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="landing-lead ml-2 text-xs font-medium">carevippro.app</span>
            </div>

            <div className="landing-mockup-body flex min-h-[280px] sm:min-h-[340px]">
              <aside className="landing-mockup-sidebar hidden w-[72px] shrink-0 flex-col gap-2 p-3 sm:flex">
                {[
                  "bg-brand-500 landing-sidebar-pulse",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-violet-500",
                  "bg-sky-500",
                ].map((color, i) => (
                  <div
                    key={color}
                    className={`h-8 w-8 rounded-lg ${color} ${i === 0 ? "opacity-100" : "opacity-40"}`}
                  />
                ))}
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="landing-mockup-divider flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="landing-title text-sm font-semibold">Tin nhắn</p>
                    <p className="landing-lead text-xs">3 hội thoại mới</p>
                  </div>
                  <span className="landing-live-badge rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <span className="landing-live-dot" aria-hidden />
                    Live
                  </span>
                </div>

                <div className="flex flex-1">
                  <div className="landing-mockup-divider hidden w-[38%] border-r p-3 sm:block">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
                          n === 1 ? "bg-brand-50 dark:bg-brand-500/10" : ""
                        }`}
                      >
                        <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
                        <div className="min-w-0 flex-1">
                          <div className="landing-mockup-skeleton h-2 w-16 rounded" />
                          <div className="landing-mockup-skeleton-soft mt-1.5 h-1.5 w-24 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="space-y-3">
                      <div className="landing-chat-bubble landing-chat-bubble-1 landing-mockup-bubble mr-8 rounded-2xl rounded-tl-sm px-3 py-2.5">
                        <p className="text-[11px] leading-relaxed">
                          Chào shop, sản phẩm còn hàng không ạ?
                        </p>
                      </div>
                      <div className="landing-chat-bubble landing-chat-bubble-2 ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-500 px-3 py-2.5">
                        <p className="text-[11px] leading-relaxed text-white/95">
                          Dạ còn ạ! Em gửi bảng giá ngay nhé
                        </p>
                      </div>
                      <div className="landing-chat-bubble landing-chat-bubble-3 landing-mockup-bubble mr-10 rounded-2xl rounded-tl-sm px-3 py-2.5">
                        <p className="text-[11px] leading-relaxed">
                          Ok, gửi giúp em nhé!
                        </p>
                      </div>
                    </div>

                    <div className="landing-composer landing-mockup-divider mt-auto flex items-center gap-2 rounded-xl border bg-white px-3 py-2 dark:bg-gray-900">
                      <div className="landing-mockup-skeleton-soft h-2 flex-1 rounded" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
                        <svg
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12h14M12 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}