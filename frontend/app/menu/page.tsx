'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Fuel,
  ArrowRight,
  Percent,
  MapPin,
  Shield,
  BarChart3,
  Handshake,
  Route,
  Calendar,
  Glasses,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScheduleModal } from '@/components/schedule-modal'

const STATS = [
  { value: '3%', label: 'Fee', description: 'Lowest in market' },
  { value: '+5,000', label: 'Active Vehicles', description: 'Fleets managed' },
  { value: '24/7', label: 'Technical Support', description: 'Always available' },
  { value: '99.9%', label: 'Uptime', description: 'System reliability' },
]

const FEATURES = [
  {
    icon: Percent,
    title: '3% Fee',
    subtitle: 'Lowest in market',
    description:
      'Save significantly on every transaction. Our 3% fee is unbeatable compared to competitors charging up to 8%.',
    highlight: '3%',
    highlightLabel: 'fee',
  },
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    subtitle: 'GPS integrated',
    description:
      'Monitor every fuel load in real time. Know exactly where, when, and how much fuel is loaded on each vehicle.',
    highlight: '24/7',
    highlightLabel: 'tracking',
  },
  {
    icon: Shield,
    title: 'Advanced Security',
    subtitle: 'Total protection',
    description:
      'Bank-level encryption, two-factor authentication, and instant alerts for any suspicious activity.',
    highlight: '100%',
    highlightLabel: 'secure',
  },
  {
    icon: BarChart3,
    title: 'Smart Reports',
    subtitle: 'Valuable insights',
    description:
      'Access detailed reports instantly. Analyze consumption patterns, optimize routes, and reduce operational costs.',
    highlight: 'Instant',
    highlightLabel: 'reports',
  },
  {
    icon: Handshake,
    title: 'Strategic Partnerships',
    subtitle: 'Premium station network',
    description:
      'Partnered with the best service stations nationwide to guarantee coverage and certified fuel quality.',
    highlight: '+500',
    highlightLabel: 'stations',
  },
  {
    icon: Route,
    title: 'Full Traceability',
    subtitle: 'Complete control',
    description:
      'Track every liter of fuel from purchase to consumption. Detailed history, simplified audits, and total transparency.',
    highlight: '100%',
    highlightLabel: 'traceable',
  },
]

export default function MenuPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header router={router} />

      {/* Hero Section */}
      <HeroSection router={router} />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  )
}

function Header({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-32 h-10">
              <Image 
                src="/assets/logos/logo_bg_sinc.png" 
                alt="TANKO" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              TANKO
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pricing
            </a>
            <a
              href="#support"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Support
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ScheduleModal>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Demo
              </Button>
            </ScheduleModal>
            <Button size="sm" onClick={() => router.push('/connect')}>
              Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function HeroSection({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Fuel className="h-4 w-4" />
            <span>Electronic Wallets for Fuel</span>
          </div>

          <div className="relative w-72 h-48 mb-8">
            <Image 
              src="/assets/logos/logo_bg_sinc.png" 
              alt="TANKO" 
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 text-balance mb-6">
            Electronic Wallets for total control of your fuel consumption with{' '}
            <span className="text-primary">TANKO</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10 text-pretty">
            The most complete solution for managing vehicle fleets. Lower fees,
            real-time tracking, and reports that transform data into intelligent
            decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <ScheduleModal>
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </ScheduleModal>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => router.push('/')}
            >
              <Glasses className="mr-2 h-5 w-5" />
              See Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
    </section>
  )
}

function StatsSection() {
  return (
    <section className="py-16 bg-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-background mb-2">
                {stat.value}
              </div>
              <div className="text-background/90 font-medium">{stat.label}</div>
              <div className="text-background/60 text-sm mt-1">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4 text-balance">
            Everything you need to manage your fleet
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            TANKO offers the most advanced tools in the market for total control of
            your fuel expenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <Card
              key={index}
              className="group border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        {feature.highlight}
                      </span>
                    </div>
                    <p className="text-primary font-medium text-sm mb-3">
                      {feature.subtitle}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="relative bg-primary rounded-3xl p-10 md:p-16 lg:p-20 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-background/30 to-transparent -z-0" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-background/20 rounded-full blur-3xl -z-0" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-left max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 text-balance">
                Transform your fleet management today
              </h2>
              <p className="text-primary-foreground/80 text-lg md:text-xl">
                Schedule a call with our team of experts and discover how TANKO can reduce your operational costs by up to 25%.
              </p>
            </div>

            <div className="flex-shrink-0">
              <ScheduleModal>
                <Button
                  size="lg"
                  className="bg-background hover:bg-background/90 text-foreground text-lg px-10 py-7 rounded-xl shadow-xl shadow-background/30 hover:shadow-2xl hover:shadow-background/40 transition-all duration-300"
                >
                  <Calendar className="mr-3 h-6 w-6" />
                  Schedule a Demo
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </ScheduleModal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const router = useRouter()

  return (
    <footer className="bg-card py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              TANKO
            </span>
          </button>

          <div className="flex items-center gap-8 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>

          <p className="text-muted-foreground text-sm">
            © 2026 TANKO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}