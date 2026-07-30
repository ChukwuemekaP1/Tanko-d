'use client'

import { HeroSection } from '@/components/hero-section'
import { BenefitsSection } from '@/components/benefits-section'
import { FeaturesSection } from '@/components/features-section'
import { PriceTransparencySection } from '@/components/price-transparency-section'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function MenuPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Header />
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <PriceTransparencySection />
      <Footer />
    </main>
  )
}
