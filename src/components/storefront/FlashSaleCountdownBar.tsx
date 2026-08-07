"use client";

import { useEffect, useState } from "react";

export default function FlashSaleCountdownBar() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const format2 = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="relative overflow-hidden rounded-xl border border-pink-200/80 bg-gradient-to-r from-slate-900 via-slate-900 to-pink-950 px-3.5 py-3 text-white shadow-sm sm:px-5 sm:py-3.5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl" />

        <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.57l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.57l7-10a1 1 0 011.12-.384z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-300">
                  Flash Sale
                </span>
                <span className="rounded-full border border-pink-400/40 bg-pink-500/20 px-2 py-0.5 text-[10px] font-extrabold text-pink-200">
                  Giảm đến 50%
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-200 sm:text-sm">
                Ưu đãi giới hạn hôm nay — đừng bỏ lỡ!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-300">Kết thúc sau</span>
            <div className="flex items-center gap-1 font-mono text-sm font-bold" aria-live="polite">
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800/90 px-1.5 text-pink-400">
                {format2(timeLeft.hours)}
              </span>
              <span className="text-pink-500">:</span>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800/90 px-1.5 text-pink-400">
                {format2(timeLeft.minutes)}
              </span>
              <span className="text-pink-500">:</span>
              <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800/90 px-1.5 text-pink-400">
                {format2(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
