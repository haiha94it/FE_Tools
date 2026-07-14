import { LANDING_USE_CASES } from "@/components/landing/landing-data";
import { LandingFeatureIcon } from "@/components/landing/LandingIcons";
import LandingReveal from "@/components/landing/LandingReveal";

const TONE_CLASSES = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
} as const;

export default function LandingUseCases() {
  return (
    <section id="doi-tuong" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            Đối tượng
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Giải pháp cho từng vai trò trong team
          </h2>
          <p className="landing-lead mt-3 text-base">
            Dù bạn là sale, marketing hay quản lý — CAREVIPPRO có workflow phù hợp.
          </p>
        </LandingReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {LANDING_USE_CASES.map((item, index) => (
            <LandingReveal
              key={item.title}
              as="article"
              delay={index * 80}
              variant="up"
              className="landing-card landing-card-pro p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[item.tone]}`}
                >
                  <LandingFeatureIcon iconKey={item.iconKey} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="landing-title text-lg font-semibold">{item.title}</h3>
                  <p className="landing-eyebrow text-xs font-medium">{item.subtitle}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-red-50/80 px-3 py-2.5 dark:bg-red-500/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400">
                    Vấn đề
                  </p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{item.pain}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/80 px-3 py-2.5 dark:bg-emerald-500/10">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    CAREVIPPRO
                  </p>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{item.solution}</p>
                </div>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}