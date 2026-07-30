"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Percent, Zap, MapPin, Shield, Fuel } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,197,94,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.08),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary">
            <Fuel className="h-4 w-4" />
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Más de 5,000 estaciones afiliadas
          </div>
          
          <h1 className="text-balance text-5xl font-black tracking-tight text-white md:text-7xl lg:text-8xl">
            El monedero electrónico para
            <span className="tanko-text-gradient"> combustibles </span>
            más inteligente
          </h1>
          
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-xl font-medium text-gray-300 md:text-2xl">
            Comisiones más bajas del mercado, registro ultrarrápido y acceso a la red de estaciones de servicio más grande. Controla tus gastos de combustible de manera eficiente.
          </p>
          
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="h-14 w-full rounded-full px-8 text-base font-bold sm:w-auto tanko-gradient-green hover:opacity-90 transition-opacity"
              asChild
            >
              <Link href="#registro">
                Solicitar Monedero
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 w-full rounded-full border-primary/30 bg-primary/5 px-8 text-base font-semibold text-primary hover:bg-primary/10 sm:w-auto"
              asChild
            >
              <Link href="#mapa">
                Ver Estaciones Cercanas
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="tanko-glass flex flex-col items-center rounded-2xl border border-primary/20 bg-card/50 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 shadow-glow-green">
              <Percent className="h-7 w-7 text-primary" />
            </div>
            <span className="text-4xl font-black text-white">0.5%</span>
            <span className="mt-2 text-sm font-semibold text-gray-300">Comisión más baja</span>
          </div>
          
          <div className="tanko-glass flex flex-col items-center rounded-2xl border border-primary/20 bg-card/50 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 shadow-glow-green">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <span className="text-4xl font-black text-white">5 min</span>
            <span className="mt-2 text-sm font-semibold text-gray-300">Registro rápido</span>
          </div>
          
          <div className="tanko-glass flex flex-col items-center rounded-2xl border border-primary/20 bg-card/50 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 shadow-glow-green">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <span className="text-4xl font-black text-white">5,000+</span>
            <span className="mt-2 text-sm font-semibold text-gray-300">Estaciones afiliadas</span>
          </div>
          
          <div className="tanko-glass flex flex-col items-center rounded-2xl border border-primary/20 bg-card/50 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 shadow-glow-green">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <span className="text-4xl font-black text-white">100%</span>
            <span className="mt-2 text-sm font-semibold text-gray-300">Seguro y confiable</span>
          </div>
        </div>
      </div>
    </section>
  )
}
