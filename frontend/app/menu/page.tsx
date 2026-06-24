'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Fuel,
  Handshake,
  MapPin,
  Percent,
  Route,
  Shield,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScheduleModal } from '@/components/schedule-modal'
import { TankoLogoMinimal } from '@/components/logo'

const STATS = [
  { value: '3%', label: 'Fee', description: 'Lowest market rate' },
  { value: '+5,000', label: 'Vehicles', description: 'Fleet assets tracked' },
  { value: '24/7', label: 'Ops', description: 'Live fuel visibility' },
  { value: '99.9%', label: 'Uptime', description: 'Control plane reliability' },
]

const FEATURES = [
  {
    icon: Percent,
    title: '3% fee rails',
    description:
      'Keep more budget in motion with transparent, low-cost fuel transactions.',
  },
  {
    icon: MapPin,
    title: 'Live station context',
    description:
      'Track where fuel is loaded, when it happened, and which unit consumed it.',
  },
  {
    icon: Shield,
    title: 'Wallet-grade control',
    description:
      'Authorize operations through connected wallets and escrow-backed releases.',
  },
  {
    icon: BarChart3,
    title: 'Operational reports',
    description:
      'Turn liters, spend, drivers, and units into fast decisions for managers.',
  },
  {
    icon: Handshake,
    title: 'Station partner network',
    description:
      'Coordinate trusted fuel points with cleaner reconciliation after every load.',
  },
  {
    icon: Route,
    title: 'End-to-end traceability',
    description:
      'Follow fuel from request to approval to confirmed consumption history.',
  },
]

export default function MenuPage() {
  const router = useRouter()

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="tanko-surface-grid pointer-events-none fixed inset-0" />

      <header className="sticky top-0 z-50 border-b border-glass-border bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20">
          <button
            onClick={() => router.push('/')}
            className="tanko-focus flex items-center gap-3 rounded-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 shadow-glow-blue">
              <TankoLogoMinimal size={22} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-title font-black tracking-[0.18em] text-white">
                TANKO
              </p>
              <p className="hidden text-micro uppercase tracking-[0.28em] text-muted-foreground sm:block">
                Stellar fuel ops
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-7 text-body-sm font-medium text-muted-foreground md:flex">
            <a className="transition-colors hover:text-white" href="#features">
              Platform
            </a>
            <a className="transition-colors hover:text-white" href="#controls">
              Controls
            </a>
            <a className="transition-colors hover:text-white" href="#support">
              Support
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ScheduleModal>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <Calendar className="h-4 w-4" />
                Demo
              </Button>
            </ScheduleModal>
            <Button size="sm" onClick={() => router.push('/connect')}>
              <WalletCards className="h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:pb-20 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-caption font-semibold uppercase tracking-[0.22em] text-primary">
            <Fuel className="h-4 w-4" />
            Electronic wallets for fuel
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-display">
            Total fuel control for fleets moving on Stellar.
          </h1>
          <p className="mt-6 max-w-2xl text-body text-muted-foreground sm:text-lg">
            Tanko gives fleet managers one sharp control plane for fuel requests,
            approvals, wallet-backed settlement, and consumption intelligence.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ScheduleModal>
              <Button size="lg" className="h-11 px-6">
                Schedule demo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </ScheduleModal>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6"
              onClick={() => router.push('/connect')}
            >
              <WalletCards className="h-4 w-4" />
              Open wallet login
            </Button>
          </div>
        </div>

        <div className="tanko-glass relative overflow-hidden rounded-lg p-4 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">
                Live command
              </p>
              <h2 className="mt-2 text-heading font-bold text-white">
                Fleet escrow pulse
              </h2>
            </div>
            <div className="rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-caption font-semibold text-success">
              Online
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-glass-border bg-glass p-4"
              >
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="mt-2 text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                  {stat.label}
                </p>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-glow-blue">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  Requests, approvals, and reports in one loop
                </p>
                <p className="text-body-sm text-muted-foreground">
                  Designed for managers who need fast signal without touching the
                  backend flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-glass-border bg-card/35 py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">
              Platform
            </p>
            <h2 className="mt-3 text-heading font-bold text-white">
              Built for fuel operations that need proof, speed, and control.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="tanko-glass-subtle rounded-lg py-0">
                <CardContent className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-title font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="controls" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="tanko-glass grid gap-8 rounded-lg p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">
              Ready for Phase 2
            </p>
            <h2 className="mt-3 text-heading font-bold text-white">
              Bring your fleet into the Tanko control plane.
            </h2>
            <p className="mt-3 max-w-2xl text-body-sm text-muted-foreground">
              Schedule a walkthrough and see how fuel requests, wallet
              approvals, and consumption dashboards connect.
            </p>
          </div>
          <ScheduleModal>
            <Button size="lg" className="h-11 px-6">
              <Calendar className="h-4 w-4" />
              Schedule demo
            </Button>
          </ScheduleModal>
        </div>
      </section>

      <footer id="support" className="border-t border-glass-border py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 text-body-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 TANKO. All rights reserved.</p>
          <div className="flex gap-5">
            <a className="transition-colors hover:text-white" href="#">
              Terms
            </a>
            <a className="transition-colors hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-white" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
