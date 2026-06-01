'use client'

import { useRouter } from 'next/navigation'
import { Fuel, Wallet, CheckCircle2, Loader2, ExternalLink, AlertCircle, Building2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/auth-provider'

export default function ConnectPage() {
  const { isConnected, isConnecting, address, error, connect, disconnect, setRole } = useAuth()
  const router = useRouter()

  const handleSelectRole = (role: 'JEFE' | 'CONDUCTOR') => {
    setRole(role)
    if (role === 'CONDUCTOR') {
      router.push('/driver')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0F1E35 0%, #1B2D4F 60%, #0F1E35 100%)' }}
    >
      {/* Brand */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #22c55e, #e06b10)' }}
        >
          <Fuel className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight">TANKO</h1>
          <p className="mt-2 text-base text-white/50">
            Decentralized fuel management for transport fleets
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm shadow-2xl">
        {isConnected && address ? (
          /* ── Connected state ── */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-2 ring-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-2">
                Wallet connected
              </p>
              <p className="font-mono text-sm text-white/90 break-all">
                {address.slice(0, 16)}…{address.slice(-16)}
              </p>
            </div>

            <div className="w-full">
              <p className="text-sm text-white/50 mb-4">
                Select your role to continue:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelectRole('JEFE')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-orange-500/30 transition-all"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(245,130,32,0.15)' }}
                  >
                    <Building2 className="h-6 w-6" style={{ color: '#22c55e' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white">Fleet Manager</p>
                    <p className="text-xs text-white/40 mt-1">Manage fleet</p>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectRole('CONDUCTOR')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-green-500/30 transition-all"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(56,217,169,0.15)' }}
                  >
                    <Truck className="h-6 w-6" style={{ color: '#38d9a9' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white">Driver</p>
                    <p className="text-xs text-white/40 mt-1">Fuel requests</p>
                  </div>
                </button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white/30 hover:text-white/50"
              onClick={disconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          /* ── Disconnected state ── */
          <div className="flex flex-col items-center gap-6 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full ring-2"
              style={{ background: 'rgba(245,130,32,0.12)', borderColor: 'rgba(245,130,32,0.3)' }}
            >
              <Wallet className="h-8 w-8" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Connect your Freighter</h2>
              <p className="mt-1 text-sm text-white/45">
                Use the Freighter extension to access Tanko
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left text-xs text-red-400 w-full">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              size="lg"
              className="w-full font-semibold text-white"
              style={{ background: '#22c55e' }}
              disabled={isConnecting}
              onClick={connect}
            >
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting…</>
              ) : (
                <><Wallet className="mr-2 h-4 w-4" />Connect with Freighter</>
              )}
            </Button>

            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/35 hover:text-white/55 transition-colors"
            >
              Don't have Freighter? Install it here
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <p className="mt-10 text-xs text-white/20">
        Stellar Testnet · Trustless Work · Hack+ Alebrije CDMX 2026 🚛
      </p>
    </div>
  )
}