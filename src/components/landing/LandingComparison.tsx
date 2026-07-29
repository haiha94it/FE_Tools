import { LANDING_COMPARISON } from "@/components/landing/landing-data";
import { IconCheck } from "@/components/landing/LandingIcons";
import LandingReveal from "@/components/landing/LandingReveal";

export default function LandingComparison() {
  const { beforeLabel, afterLabel, rows } = LANDING_COMPARISON;

  return (
    <section
      id="so-sanh"
      className="landing-section-gradient py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            So sánh
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Tại sao chuyển sang CSKH tự động?
          </h2>
          <p className="landing-lead mt-3 text-base">
            So với quản lý thủ công — tiết kiệm thời gian, giảm sai sót, scale dễ hơn.
          </p>
        </LandingReveal>

        <LandingReveal className="landing-card mt-12 overflow-hidden shadow-sm" variant="up" delay={100}>
          <div className="hidden grid-cols-[1.2fr_1fr_1fr] border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 sm:grid">
            <div className="landing-lead px-5 py-4 text-sm font-semibold">Hạng mục</div>
            <div className="landing-lead border-l border-gray-100 px-5 py-4 text-sm font-semibold dark:border-gray-800">
              {beforeLabel}
            </div>
            <div className="border-l border-gray-100 bg-brand-50/50 px-5 py-4 text-sm font-semibold text-brand-700 dark:border-gray-800 dark:bg-brand-500/10 dark:text-brand-300">
              {afterLabel}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, index) => (
              <div
                key={row.aspect}
                className={`grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_1fr_1fr] sm:gap-0 sm:px-0 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50/40 dark:bg-gray-900/60"
                }`}
              >
                <div className="landing-title px-1 text-sm font-semibold sm:px-5">{row.aspect}</div>
                <div className="rounded-lg bg-red-50/60 px-3 py-2 text-sm text-gray-600 dark:bg-red-500/10 dark:text-gray-400 sm:rounded-none sm:border-l sm:border-gray-100 sm:bg-transparent sm:px-5 dark:sm:border-gray-800">
                  <span className="mr-1 font-medium text-red-500 dark:text-red-400 sm:hidden">Trước: </span>
                  {row.before}
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50/60 px-3 py-2 text-sm text-gray-700 dark:bg-emerald-500/10 dark:text-gray-300 sm:rounded-none sm:border-l sm:border-gray-100 sm:bg-brand-50/30 sm:px-5 dark:sm:border-gray-800 dark:sm:bg-brand-500/10">
                  <IconCheck className="mt-0.5 hidden h-4 w-4 shrink-0 text-emerald-600 sm:block" />
                  <span>
                    <span className="mr-1 font-medium text-emerald-600 sm:hidden">Sau: </span>
                    {row.after}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}