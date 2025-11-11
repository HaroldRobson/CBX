'use client';

import { HeroSection } from '@/components/sections/HeroSection';
import { RateMyVCCSection } from '@/components/sections/RateMyVCCSection';
import { ProblemSolutionSection } from '@/components/sections/ProblemSolutionSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { FAQSection } from '@/components/sections/FAQSection';
import { WaitlistSection } from '@/components/sections/WaitlistSection';
import { Footer } from '@/components/sections/Footer';
import { Navigation } from '@/components/ui/Navigation';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export default function Home() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-[#171717]">
        <Navigation />
        <HeroSection />
        <RateMyVCCSection />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <FAQSection />
        <WaitlistSection />
        <Footer />
      </div>
    </ThemeProvider>
  );
}