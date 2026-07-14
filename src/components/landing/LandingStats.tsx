import LandingStatItem from "@/components/landing/LandingStatItem";
import { LANDING_STATS } from "@/components/landing/landing-data";

export default function LandingStats() {
  return (
    <section className="landing-section border-b py-10 sm:py-12" aria-label="Số liệu">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {LANDING_STATS.map((stat, index) => (
          <LandingStatItem
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delay={index * 100}
          />
        ))}
      </div>
    </section>
  );
}