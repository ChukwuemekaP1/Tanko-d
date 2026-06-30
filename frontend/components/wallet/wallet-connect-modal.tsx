"use client";

import { useEffect, useState } from "react";
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
  CORE_WALLET,
  WALLET_OPTIONS,
  type StellarWalletType,
  type WalletType,
} from "@/lib/wallet/types";
import {
  getWalletAvailability,
  isStellarWalletAvailable,
} from "@/lib/wallet/stellar-wallet-service";
import {
  CORE_INSTALL_URL,
  isCoreWalletInstalled,
} from "@/lib/wallet/core-wallet-service";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { connectWithWallet, isConnecting, error } = useAuth();
  const [pendingId, setPendingId] = useState<WalletType | null>(null);
  const [availability, setAvailability] = useState<Record<WalletType, boolean> | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setAvailability(null);

    getWalletAvailability()
      .then((status) => {
        if (!cancelled) {
          setAvailability(status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSelect(walletId: WalletType) {
    const available =
      availability?.[walletId] ?? isWalletAvailable(walletId);
    if (!available) {
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

  function walletAvailable(walletId: WalletType): boolean {
    if (availability) {
      return availability[walletId];
    }

    if (walletId === CORE_WALLET) {
      return isCoreWalletInstalled();
    }

    return isStellarWalletAvailable(walletId as StellarWalletType);
  }

  function walletHint(walletId: WalletType, requiresProjectId?: boolean): string {
    const option = WALLET_OPTIONS.find((w) => w.id === walletId);

    if (!walletAvailable(walletId)) {
      if (walletId === CORE_WALLET) {
        return "Instala Core Wallet para Avalanche C-Chain";
      }
      if (requiresProjectId) {
        return "Configura NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID en .env";
      }
      if (walletId === "freighter") {
        return "Instala la extension Freighter (Testnet)";
      }
      return "No disponible en este navegador";
    }

    return option?.description ?? "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[#0F1E35] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Conectar wallet</DialogTitle>
          <DialogDescription className="text-white/50">
            Core Wallet es el proveedor principal para Avalanche. Stellar sigue disponible para flujos existentes.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {!availability && open && (
          <p className="flex items-center justify-center gap-2 text-xs text-white/40">
            <Loader2 className="h-3 w-3 animate-spin" />
            Detectando wallets disponibles…
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WALLET_OPTIONS.map((wallet) => {
            const available = walletAvailable(wallet.id);
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
                    {walletHint(wallet.id, wallet.requiresProjectId)}
                  </p>
                </div>
                {wallet.installUrl && !available && (
                  <a
                    href={wallet.id === CORE_WALLET ? CORE_INSTALL_URL : wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-green-400/80 hover:text-green-300"
                  >
                    Instalar {wallet.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-white/30">
          Avalanche C-Chain / Fuji via Core Wallet · Stellar Testnet
        </p>
      </DialogContent>
    </Dialog>
  );
}
