"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  ensureKitInitialized,
  getNetworkPassphrase,
  isKitInitialized,
} from "@/lib/wallet/kit";
import {
  FREIGHTER_WALLET,
  WALLET_CONNECT_WALLET,
  type WalletType,
} from "@/lib/wallet/types";

function walletConnectConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim());
}

function formatWalletError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null) {
    const obj = err as { message?: string; code?: number };
    if (obj.message) {
      return obj.message;
    }
  }
  return "No se pudo conectar la wallet. Desbloquéala e inténtalo de nuevo.";
}

function unavailableMessage(walletType: WalletType): string {
  switch (walletType) {
    case FREIGHTER_WALLET:
      return "Freighter no está instalado o no responde. Instálalo desde freighter.app, pon la red en Testnet y recarga esta página.";
    case "albedo":
      return "No se pudo abrir Albedo. Comprueba que tu navegador no bloquee ventanas emergentes.";
    case WALLET_CONNECT_WALLET:
      return "WalletConnect no está configurado. Añade NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID en el archivo .env (https://cloud.reown.com).";
    default:
      return "Esta wallet no está disponible en este navegador.";
  }
}

async function connectFreighterDirect(): Promise<string> {
  const freighter = await import("@stellar/freighter-api");
  const { isConnected, error: connectError } = await freighter.isConnected();

  if (connectError || !isConnected) {
    throw new Error(unavailableMessage(FREIGHTER_WALLET));
  }

  const { address, error } = await freighter.requestAccess();
  if (error) {
    throw new Error(`Freighter rechazó la conexión: ${error}`);
  }
  if (!address) {
    throw new Error("Freighter no devolvió una dirección pública.");
  }

  return address;
}

export function isWalletAvailable(walletType: WalletType): boolean {
  if (walletType === WALLET_CONNECT_WALLET) {
    return walletConnectConfigured();
  }
  return true;
}

export async function getWalletAvailability(): Promise<
  Record<WalletType, boolean>
> {
  const base: Record<WalletType, boolean> = {
    freighter: false,
    albedo: true,
    wallet_connect: walletConnectConfigured(),
  };

  if (typeof window === "undefined") {
    return base;
  }

  try {
    await ensureKitInitialized();
    const wallets = await StellarWalletsKit.refreshSupportedWallets();
    for (const wallet of wallets) {
      const id = wallet.id as WalletType;
      if (id in base) {
        base[id] = Boolean(wallet.isAvailable);
      }
    }
    if (!walletConnectConfigured()) {
      base.wallet_connect = false;
    }
  } catch (err) {
    console.warn("[Tanko] Wallet availability check failed:", err);
  }

  return base;
}

export async function connectWallet(walletType: WalletType): Promise<string> {
  if (!isWalletAvailable(walletType)) {
    throw new Error(unavailableMessage(walletType));
  }

  await ensureKitInitialized();

  const supported = await StellarWalletsKit.refreshSupportedWallets();
  const entry = supported.find((w) => w.id === walletType);

  if (entry && !entry.isAvailable && walletType !== "albedo") {
    if (walletType === FREIGHTER_WALLET) {
      return connectFreighterDirect();
    }
    throw new Error(unavailableMessage(walletType));
  }

  StellarWalletsKit.setWallet(walletType);

  try {
    const { address } = await StellarWalletsKit.fetchAddress();
    if (!address) {
      throw new Error("La wallet no devolvió una clave pública.");
    }
    return address;
  } catch (err) {
    if (walletType === FREIGHTER_WALLET) {
      try {
        return await connectFreighterDirect();
      } catch (fallbackErr) {
        throw new Error(formatWalletError(fallbackErr));
      }
    }
    throw new Error(formatWalletError(err));
  }
}

export async function restoreStellarWalletSession(
  walletType: StellarWalletType,
): Promise<string | null> {
  if (!isStellarWalletAvailable(walletType)) {
    return null;
  }

  try {
    await ensureKitInitialized();
    StellarWalletsKit.setWallet(walletType);

    if (walletType === FREIGHTER_WALLET) {
      const freighter = await import("@stellar/freighter-api");
      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        return null;
      }
      const { isAllowed } = await freighter.isAllowed();
      if (!isAllowed) {
        return null;
      }
      const { address, error } = await freighter.getAddress();
      if (error || !address) {
        return null;
      }
      return address;
    }

    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

export async function signWalletTransaction(
  xdr: string,
  address: string,
): Promise<string> {
  await ensureKitInitialized();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: getNetworkPassphrase(),
    address,
  });
  return signedTxXdr;
}

export async function disconnectStellarWallet(): Promise<void> {
  if (typeof window === "undefined" || !isKitInitialized()) {
    return;
  }
  try {
    await StellarWalletsKit.disconnect();
  } catch (err) {
    console.warn("[Tanko] Wallet disconnect:", err);
  }
}

export const isWalletAvailable = isStellarWalletAvailable;
export const connectWallet = connectStellarWallet;
export const restoreWalletSession = restoreStellarWalletSession;
export const disconnectWallet = disconnectStellarWallet;
