import LandingComparison from "@/components/landing/LandingComparison";
import LandingCta from "@/components/landing/LandingCta";
import LandingDeepDive from "@/components/landing/LandingDeepDive";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingMarquee from "@/components/landing/LandingMarquee";
import LandingNav from "@/components/landing/LandingNav";
import LandingProductShowcase from "@/components/landing/LandingProductShowcase";
import LandingStats from "@/components/landing/LandingStats";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingUseCases from "@/components/landing/LandingUseCases";

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingMarquee />
        <LandingStats />
        <LandingProductShowcase />
        <LandingUseCases />
        <LandingFeatures />
        <LandingDeepDive />
        <LandingComparison />
        <LandingHowItWorks />
        <LandingTestimonials />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}