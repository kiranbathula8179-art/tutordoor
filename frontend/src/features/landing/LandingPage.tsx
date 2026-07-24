import { AdvancedSearchV3 } from "@/features/landing/v3/AdvancedSearchV3";
import { AnnouncementBar, HeroV3, NavV3 } from "@/features/landing/v3/HeroV3";
import { CategoriesV3, CtaV3, FaqV3, FeaturedTutorsV3, FooterV3, HowItWorksV3, WhyV3 } from "@/features/landing/v3/SectionsV3";
import { TestimonialsV3 } from "@/features/landing/v3/TestimonialsV3";

/**
 * Landing — V3 "Bright" (DESIGN_V3.md), now on the same premium foundation
 * (canonical motion tokens, Surface depth layers) as every other elevated
 * page in the app.
 *
 * Composition: announcement → sticky nav → hero (real tutors as the visual,
 * quick search) → advanced search (full real filter surface, deep-links into
 * /search) → categories (live API) → featured tutors → how it works → why →
 * testimonials (real reviews, sourced from the public reviews endpoint — hides
 * gracefully if none exist yet) → FAQ → CTA → footer.
 *
 * The v2 Observatory landing files remain on disk until the cleanup pass.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-ice text-navy antialiased">
      <AnnouncementBar />
      <NavV3 />
      <main>
        <HeroV3 />
        <AdvancedSearchV3 />
        <CategoriesV3 />
        <FeaturedTutorsV3 />
        <HowItWorksV3 />
        <WhyV3 />
        <TestimonialsV3 />
        <FaqV3 />
        <CtaV3 />
      </main>
      <FooterV3 />
    </div>
  );
}
