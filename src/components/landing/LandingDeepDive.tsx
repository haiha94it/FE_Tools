import { LANDING_DEEP_DIVES } from "@/components/landing/landing-data";
import { IconCheck } from "@/components/landing/LandingIcons";
import LandingReveal from "@/components/landing/LandingReveal";
import Image from "next/image";

const BADGE_TONE = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  purple:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
} as const;

export default function LandingDeepDive() {
  return (
    <section id="chi-tiet" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Chi tiết
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Đi sâu vào từng module cốt lõi
          </h2>
          <p className="landing-lead mt-3 text-base">
            Mỗi tính năng được thiết kế tỉ mỉ để tối ưu hiệu suất cho team của bạn.
          </p>
        </LandingReveal>

        <div className="mt-16 space-y-16 sm:space-y-24">
          {LANDING_DEEP_DIVES.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-14 ${
                item.reverse ? "lg:flex-row-reverse" : ""
              }`}
            >
              <LandingReveal
                variant={item.reverse ? "right" : "left"}
                className="w-full lg:w-1/2"
              >
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${BADGE_TONE[item.tone]}`}
                >
                  {item.badge}
                </span>
                <h3 className="landing-title mt-3 text-xl font-bold leading-snug sm:text-2xl">
                  {item.title}
                </h3>
                <p className="landing-lead mt-3 text-sm leading-relaxed sm:text-base">
                  {item.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 font-bold">
                        <IconCheck className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </LandingReveal>

              <LandingReveal
                variant={item.reverse ? "left" : "right"}
                delay={100}
                className="w-full lg:w-1/2"
              >
                <div className="landing-card overflow-hidden shadow-xl shadow-brand-500/10">
                  <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </LandingReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}