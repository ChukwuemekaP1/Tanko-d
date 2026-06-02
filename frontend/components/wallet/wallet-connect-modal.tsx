"use client";

import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  WALLET_OPTIONS,
  type WalletType,
} from "@/lib/wallet/types";
import { isWalletAvailable } from "@/lib/wallet/stellar-wallet-service";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { connectWithWallet, isConnecting, error } = useAuth();
  const [pendingId, setPendingId] = useState<WalletType | null>(null);

  async function handleSelect(walletId: WalletType) {
    if (!isWalletAvailable(walletId)) {
      return;
    }
    setPendingId(walletId);
    try {
      await connectWithWallet(walletId);
      onOpenChange(false);
    } catch {
      // error surfaced via auth context
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[#0F1E35] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Connect a wallet</DialogTitle>
          <DialogDescription className="text-white/50">
            Choose Freighter, Albedo, or WalletConnect for mobile Stellar wallets.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WALLET_OPTIONS.map((wallet) => {
            const available = isWalletAvailable(wallet.id);
            const busy = isConnecting && pendingId === wallet.id;

            return (
              <button
                key={wallet.id}
                type="button"
                disabled={!available || isConnecting}
                onClick={() => handleSelect(wallet.id)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center transition-all hover:border-green-500/40 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  {busy ? (
                    <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={wallet.iconUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{wallet.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/45">
                    {wallet.requiresProjectId && !available
                      ? "Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
                      : wallet.description}
                  </p>
                </div>
                {wallet.installUrl && (
                  <a
                    href={wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-white/60"
                  >
                    Get {wallet.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-white/30">
          Stellar Testnet · Soroban signing supported across providers
        </p>
      </DialogContent>
    </Dialog>
  );
}
