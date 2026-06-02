'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { WalletConnectModal } from '@/components/wallet/wallet-connect-modal'
import { Wallet, ChevronDown, LogOut, Copy, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WalletButtonProps {
  className?: string
}

export function WalletButton({ className }: WalletButtonProps) {
  const { isConnected, isConnecting, address, walletLabel, disconnect } = useAuth()
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function copyAddress() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Address copied')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Connected chip ────────────────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
        >
          {/* Status dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          {/* Address */}
          <span className="font-mono text-xs tracking-tight text-foreground">
            {address.slice(0, 6)}&thinsp;…&thinsp;{address.slice(-6)}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-xl z-50">
            {/* Full address */}
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Connected wallet ({walletLabel})</p>
              <p className="font-mono text-xs text-foreground break-all leading-relaxed">{address}</p>
            </div>

            <div className="space-y-1">
              <button
                onClick={copyAddress}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                {copied ? 'Copied!' : 'Copy address'}
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                View on Stellar Explorer
              </a>
              <button
                onClick={() => { void disconnect(); setOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        disabled={isConnecting}
        size="sm"
        className={`font-semibold text-white ${className}`}
        style={{ background: '#F58220' }}
      >
        {isConnecting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting…</>
        ) : (
          <><Wallet className="mr-2 h-4 w-4" />Connect Wallet</>
        )}
      </Button>
      <WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}

export default WalletButton
