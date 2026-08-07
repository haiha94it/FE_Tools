"use client";

interface GuaranteeFooterProps {
  shopName?: string | null;
  /** @deprecated — footer luôn high-contrast dark, không phụ thuộc primary */
  variant?: "auto" | "light" | "ink";
  safeBottom?: boolean;
  className?: string;
  /** Accent color for icons / labels (defaults to CSS var) */
  accentColor?: string;
  isDark?: boolean;
  contactPhone?: string;
  contactZalo?: string;
  contactFacebook?: string;
  contactWebsite?: string;
  contactAddress?: string;
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
    desc: "Hotline & Tư vấn qua Zalo OA nhanh chóng.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
  },
] as const;

export default function GuaranteeFooter({
  shopName,
  safeBottom = false,
  className = "",
  accentColor,
  isDark = true,
  contactPhone,
  contactZalo,
  contactFacebook,
  contactWebsite,
  contactAddress,
}: GuaranteeFooterProps) {
  const accent = accentColor || "var(--store-accent, #f43f5e)";

  const hasContactInfo =
    contactPhone ||
    contactZalo ||
    contactFacebook ||
    contactWebsite ||
    contactAddress;

  return (
    <footer
      className={`border-t transition-colors duration-300 ${
        isDark
          ? "border-stone-800 bg-[#0B0F19] text-stone-100"
          : "border-stone-800 bg-stone-950 text-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100"
      } ${className}`}
      style={{
        paddingBottom: safeBottom
          ? "max(6.5rem, calc(4.5rem + env(safe-area-inset-bottom)))"
          : "3rem",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        {/* Dynamic Contact Bar */}
        {hasContactInfo ? (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              📞 Thông tin liên hệ
            </h4>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              {contactPhone ? (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Hotline: {contactPhone}</span>
                </a>
              ) : null}

              {contactZalo ? (
                <a
                  href={contactZalo.startsWith("http") ? contactZalo : `https://${contactZalo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 font-bold text-sky-400 transition hover:bg-sky-500/20"
                >
                  <span>Zalo OA / Tư vấn</span>
                </a>
              ) : null}

              {contactFacebook ? (
                <a
                  href={contactFacebook.startsWith("http") ? contactFacebook : `https://${contactFacebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 font-bold text-blue-400 transition hover:bg-blue-500/20"
                >
                  <span>Facebook Fanpage</span>
                </a>
              ) : null}

              {contactWebsite ? (
                <a
                  href={contactWebsite.startsWith("http") ? contactWebsite : `https://${contactWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 font-bold text-amber-400 transition hover:bg-amber-500/20"
                >
                  <span>Website</span>
                </a>
              ) : null}

              {contactAddress ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 font-medium text-slate-300">
                  <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Địa chỉ: {contactAddress}</span>
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map((item, idx) => {
            const styles = [
              { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
              { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
              { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
              { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30" },
            ][idx % 4];

            return (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.bg} ${styles.text} ${styles.border}`}
                >
                  <svg
                    className="h-5 w-5 text-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
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
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
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
