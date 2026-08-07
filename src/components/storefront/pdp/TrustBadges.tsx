"use client";

const ITEMS = [
  {
    label: "Freeship nội thành",
    sub: "Giao hỏa tốc 2H",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177A48.78 48.78 0 0012 2.25"
      />
    ),
  },
  {
    label: "COD kiểm hàng",
    sub: "Thanh toán khi nhận",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    label: "BH 12 tháng",
    sub: "Chính hãng đầy đủ",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    ),
  },
] as const;

export default function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "sm:gap-3"}`}>
      {ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-2xl border border-white/60 bg-white/70 px-2 py-3.5 text-center shadow-sm backdrop-blur-sm sm:px-3"
          style={{ borderColor: "color-mix(in srgb, var(--store-border, #e2e8f0) 100%, transparent)" }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--store-accent)_12%,white)] text-[var(--store-accent)]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              {item.icon}
            </svg>
          </div>
          <p className="mt-2 text-[11px] font-bold text-[var(--store-primary)] sm:text-xs">
            {item.label}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-[var(--store-muted)]">
            {item.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
