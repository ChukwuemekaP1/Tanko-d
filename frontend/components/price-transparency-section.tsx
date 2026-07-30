import { DollarSign, TrendingDown, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const pricingData = [
  {
    title: "Traditional Fuel Cards",
    fee: "3-5%",
    hidden: true,
    intermediaries: true,
    speed: "Slow",
    transparency: "Low"
  },
  {
    title: "Other E-Wallets",
    fee: "1.5-2.5%",
    hidden: true,
    intermediaries: true,
    speed: "Medium",
    transparency: "Medium"
  },
  {
    title: "TANKO",
    fee: "0.5%",
    hidden: false,
    intermediaries: false,
    speed: "Instant",
    transparency: "100%",
    featured: true
  }
]

export function PriceTransparencySection() {
  return (
    <section id="pricing" className="relative bg-background py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.08),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="tanko-badge tanko-badge-yellow mb-6 inline-flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Transparent Pricing
          </div>
          <h2 className="text-balance text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            See the difference
          </h2>
          <p className="mt-6 text-pretty text-xl font-medium text-gray-300 md:text-2xl">
            Compare our transparent pricing with traditional fuel cards and other e-wallet solutions.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {pricingData.map((plan, index) => (
            <div
              key={plan.title}
              className={`tanko-glass relative overflow-hidden rounded-2xl border p-8 backdrop-blur-sm ${
                plan.featured
                  ? "border-primary/40 bg-primary/10 shadow-glow-green scale-105"
                  : "border-primary/20 bg-card/50"
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-green-600 py-2 text-center">
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Best Value
                  </span>
                </div>
              )}
              
              <div className="mb-6 mt-4">
                <h3 className="text-2xl font-bold text-white">{plan.title}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{plan.fee}</span>
                  <span className="text-lg font-semibold text-gray-300">fee</span>
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${!plan.hidden ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium text-gray-200">
                    {!plan.hidden ? 'No hidden costs' : 'Hidden fees possible'}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${!plan.intermediaries ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium text-gray-200">
                    {!plan.intermediaries ? 'Zero intermediaries' : 'Multiple intermediaries'}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${plan.speed === 'Instant' ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium text-gray-200">
                    {plan.speed} transactions
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${plan.transparency === '100%' ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium text-gray-200">
                    {plan.transparency} transparency
                  </span>
                </li>
              </ul>

              {plan.featured && (
                <div className="mt-8">
                  <Button 
                    className="h-12 w-full rounded-full tanko-gradient-green font-bold hover:opacity-90 transition-opacity"
                    asChild
                  >
                    <Link href="#registro">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg font-medium text-gray-300">
            <TrendingDown className="inline h-5 w-5 mr-2 text-primary" />
            Save up to 90% on transaction fees compared to traditional fuel cards
          </p>
        </div>
      </div>
    </section>
  )
}
