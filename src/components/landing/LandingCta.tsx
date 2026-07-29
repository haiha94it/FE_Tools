import LandingAuthActions from "@/components/landing/LandingAuthActions";
import LandingReveal from "@/components/landing/LandingReveal";

export default function LandingCta() {
  return (
    <section className="pb-16 sm:pb-20 lg:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <LandingReveal variant="scale">
          <div className="landing-cta-border relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div
              className="landing-cta-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl"
              aria-hidden
            />
            <div
              className="landing-cta-glow pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-blue-light-500/20 blur-3xl"
              aria-hidden
              style={{ animationDelay: "1.5s" }}
            />

            <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Sẵn sàng tăng tốc vận hành Zalo?
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
              Tham gia CSKH tự động hôm nay — quản lý tài khoản, chat và chiến dịch trên một
              nền tảng thống nhất.
            </p>

            <LandingAuthActions variant="cta" />
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}