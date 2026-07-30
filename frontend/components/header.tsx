"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Fuel, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/menu" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 shadow-glow-green">
            <Fuel className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white">TANKO</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Fuel Wallet</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#benefits" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Benefits
          </Link>
          <Link href="#features" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href="/dashboard">Login</Link>
          </Button>
          <Button 
            size="sm" 
            className="rounded-full tanko-gradient-green font-bold hover:opacity-90 transition-opacity"
            asChild
          >
            <Link href="#registro">
              <Wallet className="mr-2 h-4 w-4" />
              Get Wallet
            </Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-primary/20 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            <Link href="#benefits" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Benefits
            </Link>
            <Link href="#features" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-primary/20">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                asChild
              >
                <Link href="/dashboard">Login</Link>
              </Button>
              <Button 
                size="sm" 
                className="rounded-full tanko-gradient-green font-bold hover:opacity-90 transition-opacity"
                asChild
              >
                <Link href="#registro">
                  <Wallet className="mr-2 h-4 w-4" />
                  Get Wallet
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
