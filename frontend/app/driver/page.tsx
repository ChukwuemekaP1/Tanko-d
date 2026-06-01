'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Fuel,
  Copy,
  CheckCheck,
  ChevronRight,
  Wallet,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'

interface Balance {
  asset: string
  balance: string
}

export default function DriverPage() {
  const router = useRouter()
  const { address, isConnected, isConnecting, disconnect, role } = useAuth()
  const [copied, setCopied] = useState(false)
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push('/connect')
    }
  }, [isConnected, isConnecting, router])

  useEffect(() => {
    async function fetchBalances() {
      if (!address) return

      try {
        const res = await fetch(`/api/stellar/balance?address=${address}&asset=XLM`)
        if (res.ok) {
          const data = await res.json()
          if (data.balance) {
            setBalances([{ asset: 'XLM', balance: data.balance }])
          }
        }

        const usdcRes = await fetch(`/api/stellar/balance?address=${address}&asset=USDC`)
        if (usdcRes.ok) {
          const usdcData = await usdcRes.json()
          if (usdcData.balance) {
            setBalances(prev => [...prev, { asset: 'USDC', balance: usdcData.balance }])
          }
        }
      } catch (error) {
        console.error('Error fetching balances:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()
  }, [address])

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleDisconnect() {
    disconnect()
    router.push('/menu')
  }

  function truncate(addr: string, start = 8, end = 6) {
    return `${addr.slice(0, start)}…${addr.slice(-end)}`
  }

  const xlmBalance = balances.find(b => b.asset === 'XLM')?.balance || '0'
  const usdcBalance = balances.find(b => b.asset === 'USDC')?.balance || '0'
  const totalUSD = (parseFloat(usdcBalance)).toFixed(2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderTopColor: '#22c55e' }} />
          <p className="text-sm text-white/50">Loading balance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%)' }}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-64 flex-col transition-transform lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#1B2D4F' }}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <span className="text-lg font-bold text-white">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>
        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => router.push('/driver')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-white/10"
          >
            <Wallet className="h-5 w-5" />
            My Wallet
          </button>
        </div>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleDisconnect}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Disconnect
          </button>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4">
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1" />
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>

        <main className="flex-1 p-4">
          <div className="mx-auto max-w-md space-y-6">
            <div
              className="relative overflow-hidden rounded-3xl p-6 text-white"
              style={{
                background: 'linear-gradient(135deg, #415a77 0%, #1b263b 50%, #0d1b2a 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Fuel className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-white/80">TANKO</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                    Driver
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">Total Balance</p>
                  <p className="mt-1 text-5xl font-black tracking-tight">
                    ${totalUSD}
                    <span className="ml-2 text-lg font-normal text-white/50">USD</span>
                  </p>
                </div>

                <button
                  onClick={copyAddress}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 font-mono text-sm text-white/70 backdrop-blur-sm transition hover:bg-white/20 active:scale-95 w-full justify-center"
                >
                  {address ? truncate(address) : 'Not connected'}
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-green-300" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-white/10 bg-white/[0.04]">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">USDC</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    ${parseFloat(usdcBalance).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/10 bg-white/[0.04]">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/40">XLM</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {parseFloat(xlmBalance).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button
              className="w-full py-6 text-lg font-semibold"
              style={{ background: '#22c55e' }}
              onClick={() => router.push('/connect')}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Request Fuel Funds
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-medium text-white mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] p-3 hover:bg-white/[0.08] transition">
                  <span className="text-sm text-white/70">Fuel History</span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </button>
                <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] p-3 hover:bg-white/[0.08] transition">
                  <span className="text-sm text-white/70">My Vehicle</span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </button>
                <button className="flex w-full items-center justify-between rounded-xl bg-white/[0.04] p-3 hover:bg-white/[0.08] transition">
                  <span className="text-sm text-white/70">Settings</span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}