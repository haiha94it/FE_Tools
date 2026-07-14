import { LANDING_STEPS } from "@/components/landing/landing-data";
import LandingReveal from "@/components/landing/LandingReveal";

export default function LandingHowItWorks() {
  return (
    <section
      id="cach-hoat-dong"
      className="landing-section py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal className="mx-auto max-w-2xl text-center" variant="up">
          <p className="landing-eyebrow text-sm font-semibold uppercase tracking-wider">
            Cách hoạt động
          </p>
          <h2 className="landing-title mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bắt đầu trong 3 bước đơn giản
          </h2>
        </LandingReveal>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {LANDING_STEPS.map((item, index) => (
            <LandingReveal key={item.step} as="li" delay={index * 120} variant="up" className="relative">
              {index < LANDING_STEPS.length - 1 && (
                <div
                  className="landing-step-line absolute top-8 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] md:block"
                  aria-hidden
                />
              )}
              <div className="landing-card landing-card-pro flex h-full flex-col p-6">
                <span className="text-3xl font-bold text-brand-200 dark:text-brand-500/40">{item.step}</span>
                <h3 className="landing-title mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="landing-lead mt-2 flex-1 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </LandingReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}