import { LANDING_TESTIMONIALS } from "@/components/landing/landing-data";
import LandingReveal from "@/components/landing/LandingReveal";

export default function LandingTestimonials() {
  return (
    <section id="danh-gia" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            Đánh giá
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Được tin dùng bởi team sale & marketing
          </h2>
        </LandingReveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item, index) => (
            <LandingReveal
              key={item.name}
              as="figure"
              delay={index * 100}
              variant="scale"
              className="landing-card landing-card-pro flex h-full flex-col p-6"
            >
              <div className="mb-4 flex gap-0.5 text-amber-400" aria-label="5 sao">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 20 20"
                    aria-hidden
                  >
                    <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.81.94-5.5-4-3.9 5.53-.8L10 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote className="landing-lead flex-1 text-sm italic leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  {item.initials}
                </div>
                <div>
                  <p className="landing-title text-sm font-semibold">{item.name}</p>
                  <p className="landing-lead text-xs">{item.role}</p>
                </div>
              </figcaption>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}