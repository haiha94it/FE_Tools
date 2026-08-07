"use client";

interface GuaranteeFooterProps {
  shopName?: string | null;
  /** @deprecated — footer luôn high-contrast dark, không phụ thuộc primary (tránh primary sáng → chữ trắng) */
  variant?: "auto" | "light" | "ink";
  safeBottom?: boolean;
  className?: string;
  /** Accent color for icons / labels (defaults to CSS var) */
  accentColor?: string;
}

const FEATURES = [
  {
    title: "Giao hàng siêu tốc 2H",
    desc: "Nhận hàng hỏa tốc nội thành TP.HCM & Hà Nội.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    title: "Cam kết chính hãng 100%",
    desc: "Hoàn tiền 200% nếu phát hiện hàng giả, hàng nhái.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    title: "Đổi trả dễ dàng 7 ngày",
    desc: "1 đổi 1 miễn phí nếu lỗi từ nhà sản xuất.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    ),
  },
  {
    title: "Hỗ trợ Zalo 24/7",
    desc: "Hotline 1900 6868 · Tư vấn qua Zalo OA.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
  },
] as const;

/**
 * Footer luôn nền tối cố định + chữ sáng (WCAG).
 * Không dùng --store-primary làm background (theme dark gán primary = trắng).
 */
export default function GuaranteeFooter({
  shopName,
  safeBottom = false,
  className = "",
  accentColor,
}: GuaranteeFooterProps) {
  const accent = accentColor || "var(--store-accent, #f43f5e)";

  return (
    <footer
      className={`border-t border-white/10 text-white ${className}`}
      style={{
        backgroundColor: "#0B0F19",
        color: "#F8FAFC",
        paddingBottom: safeBottom
          ? "max(1.5rem, env(safe-area-inset-bottom))"
          : undefined,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
           
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {shopName?.trim() || "Cửa hàng chính hãng"}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Giao hàng · Đổi trả · Hỗ trợ Zalo
            </p>
          </div>
          <a
            href="#products"
            className="inline-flex w-fit cursor-pointer items-center rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Xem sản phẩm
          </a>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${typeof accent === "string" && accent.startsWith("#") ? accent : "#f43f5e"} 22%, transparent)`,
                  color: accent,
                }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {item.icon}
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-200">
              Đối tác vận chuyển &amp; thanh toán
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {["ZaloPay", "MoMo", "COD", "GHN", "GHTK"].map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-white/10 px-2.5 py-1 font-bold text-slate-100"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-bold text-white">
              © {new Date().getFullYear()}{" "}
              {shopName?.trim() || "Zalo Official Store"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
