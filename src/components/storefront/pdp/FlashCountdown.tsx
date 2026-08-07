"use client";

import { useEffect, useState } from "react";

export default function FlashCountdown({
  label = "Flash Sale kết thúc sau",
}: {
  label?: string;
}) {
  const [t, setT] = useState({ h: 3, m: 28, s: 45 });

  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-3.5 py-2.5 text-white">
      <span className="text-[11px] font-extrabold uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-1 font-mono text-sm font-black">
        <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.h)}</span>
        <span>:</span>
        <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.m)}</span>
        <span>:</span>
        <span className="rounded bg-black/25 px-1.5 py-0.5">{pad(t.s)}</span>
      </div>
    </div>
  );
}
