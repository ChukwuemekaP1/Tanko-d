import { 
  Percent, 
  Zap, 
  MapPin, 
  BarChart3, 
  CreditCard, 
  Users,
  CheckCircle2,
  Shield,
  Lock
} from "lucide-react"

const benefits = [
  {
    icon: Percent,
    title: "Lowest Fees",
    description: "We offer the most competitive fees in the market. Save up to 60% compared to other e-wallet providers.",
    features: [
      "Only 0.5% per transaction",
      "No hidden costs",
      "Guaranteed savings"
    ],
    badge: "Best Value"
  },
  {
    icon: Zap,
    title: "Ultra-Fast Onboarding",
    description: "Complete your registration in under 5 minutes. Streamlined process with no unnecessary paperwork or long wait times.",
    features: [
      "Sign up in 5 minutes",
      "Automatic verification",
      "Immediate activation"
    ],
    badge: "Fast"
  },
  {
    icon: MapPin,
    title: "Station Network",
    description: "Access over 5,000 service stations nationwide. Find the nearest station with our interactive map.",
    features: [
      "Nationwide coverage",
      "Real-time map",
      "Exclusive benefits"
    ],
    badge: "5,000+ Stations"
  },
  {
    icon: BarChart3,
    title: "Full Spend Control",
    description: "Monitor every transaction with detailed reports. View consumption by unit, location, and time period.",
    features: [
      "Real-time reports",
      "Per-unit analytics",
      "Data export"
    ],
    badge: "Analytics"
  },
  {
    icon: Shield,
    title: "Blockchain Security",
    description: "Your transactions are protected by blockchain technology. Verifiable, transparent, and immutable records.",
    features: [
      "Blockchain verification",
      "Transparent records",
      "Immutable ledger"
    ],
    badge: "Secure"
  },
  {
    icon: Lock,
    title: "Zero Intermediaries",
    description: "Direct transactions between fleet and stations. No middlemen, no delays, no extra costs.",
    features: [
      "Direct payments",
      "No intermediaries",
      "Instant settlement"
    ],
    badge: "Direct"
  }
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="relative bg-card py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.06),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="tanko-badge tanko-badge-green mb-6 inline-flex items-center gap-2">
            Benefits
          </div>
          <h2 className="text-balance text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            What sets us apart
          </h2>
          <p className="mt-6 text-pretty text-xl font-medium text-gray-300 md:text-2xl">
            Built for transport companies and fleets that want to optimize fuel spending with the best technology and service.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="tanko-glass group relative overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-8 transition-all hover:border-primary/40 hover:shadow-glow-green backdrop-blur-sm"
            >
              <div className="absolute top-4 right-4">
                <span className="tanko-badge tanko-badge-yellow text-xs">
                  {benefit.badge}
                </span>
              </div>
              
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 transition-colors group-hover:bg-primary/30 shadow-glow-green">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="mb-4 text-2xl font-bold text-white">
                {benefit.title}
              </h3>
              
              <p className="mb-6 text-base font-medium text-gray-300">
                {benefit.description}
              </p>
              
              <ul className="space-y-3">
                {benefit.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-gray-200">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
