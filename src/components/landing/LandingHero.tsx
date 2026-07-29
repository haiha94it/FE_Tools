import LandingAuthActions from "@/components/landing/LandingAuthActions";
import LandingHeroMockup from "@/components/landing/LandingHeroMockup";
import { IconCheck } from "@/components/landing/LandingIcons";

const HERO_BULLETS = [
  "Tin nhắn Zalo realtime",
  "Chiến dịch marketing tự động",
  "Shop & quản lý đơn hàng",
] as const;

export default function LandingHero() {
  return (
    <section className="landing-gradient-hero relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-28">
      <div className="landing-aurora-layer" aria-hidden>
        <div className="landing-aurora-orb landing-aurora-orb-1" />
        <div className="landing-aurora-orb landing-aurora-orb-2" />
        <div className="landing-aurora-orb landing-aurora-orb-3" />
        <div className="landing-grid-pattern" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="max-w-xl">
          <div className="landing-badge-pulse landing-hero-enter landing-hero-enter-1 mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur-sm dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <span className="landing-badge-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
            Nền tảng quản trị Zalo
          </div>

          <h1 className="landing-hero-enter landing-hero-enter-2 landing-title text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            Vận hành Zalo{" "}
            <span className="landing-gradient-text">thông minh</span> trên một bảng
            điều khiển
          </h1>

          <p className="landing-hero-enter landing-hero-enter-3 landing-lead mt-5 text-base leading-relaxed sm:text-lg">
            CSKH tự động giúp team sale và marketing quản lý tài khoản, chat khách,
            chạy chiến dịch và bán hàng — không cần chuyển đổi giữa nhiều công cụ.
          </p>

          <ul className="landing-hero-enter landing-hero-enter-4 mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {HERO_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <IconCheck className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="landing-hero-enter landing-hero-enter-5 mt-8">
            <LandingAuthActions variant="hero" />
          </div>

          <p className="landing-hero-enter landing-hero-enter-5 landing-lead mt-4 text-xs">
            Không cần thẻ tín dụng · Thiết lập trong vài phút
          </p>
        </div>

        <div className="relative w-full min-w-0 lg:pl-4">
          <LandingHeroMockup />
        </div>
      </div>
    </section>
  );
}