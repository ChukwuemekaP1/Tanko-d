import Link from "next/link"
import { Fuel, Mail, Phone, MapPin, Shield } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-card">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/menu" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white">TANKO</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Fuel Wallet</span>
              </div>
            </Link>
            <p className="mt-4 text-sm font-medium text-gray-300">
              Plataforma líder en monederos electrónicos para combustibles. Comisiones bajas, registro rápido y la red de estaciones más grande del país.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-gray-400">
                Blockchain-powered security
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white">Platform</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#benefits" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Legal</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">Contact</h4>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <Mail className="h-4 w-4 text-primary" />
                support@tanko.mx
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <Phone className="h-4 w-4 text-primary" />
                +52 800 123 4567
              </li>
              <li className="flex items-start gap-3 text-sm font-medium text-gray-300">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Av. Paseo de la Reforma 505, Col. Cuauhtémoc, CDMX
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary/20 pt-8 md:flex-row">
          <p className="text-sm font-medium text-gray-400">
            © 2026 TANKO. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="tanko-badge tanko-badge-green text-xs">
              <Shield className="h-3 w-3" />
              Regulated by CONDUSEF
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
