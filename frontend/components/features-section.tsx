import { 
  Clock, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  FileText, 
  Users,
  Zap,
  Lock
} from "lucide-react"

const features = [
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description: "Monitor fuel consumption and transactions in real-time with instant updates and notifications."
  },
  {
    icon: ShieldCheck,
    title: "Blockchain Verification",
    description: "Every transaction is recorded on the blockchain for complete transparency and immutability."
  },
  {
    icon: Globe,
    title: "Geolocation Services",
    description: "Track exact locations of fuel purchases with precise GPS coordinates and station data."
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Access your fleet dashboard from anywhere with our responsive mobile application."
  },
  {
    icon: FileText,
    title: "Detailed Reports",
    description: "Generate comprehensive reports on fuel usage, costs, and driver performance."
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Manage multiple drivers, vehicles, and permissions from a centralized dashboard."
  },
  {
    icon: Zap,
    title: "Instant Approvals",
    description: "Quick approval workflows for fuel requests with customizable authorization levels."
  },
  {
    icon: Lock,
    title: "Secure Wallet",
    description: "Your funds are protected with wallet-grade security and multi-signature support."
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-card py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,0.04),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="tanko-badge tanko-badge-green mb-6 inline-flex items-center gap-2">
            Features
          </div>
          <h2 className="text-balance text-4xl font-black tracking-tight text-white md:text-5xl lg:text-6xl">
            Built for modern fleets
          </h2>
          <p className="mt-6 text-pretty text-xl font-medium text-gray-300 md:text-2xl">
            Powerful features designed to streamline your fuel operations and maximize efficiency.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="tanko-glass-subtle group rounded-xl border border-primary/15 bg-card/30 p-6 transition-all hover:border-primary/30 hover:bg-primary/5 backdrop-blur-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/25">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="mb-2 text-lg font-bold text-white">
                {feature.title}
              </h3>
              
              <p className="text-sm font-medium text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
