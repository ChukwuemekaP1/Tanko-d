"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  ensureKitInitialized,
  getNetworkPassphrase,
  isKitInitialized,
} from "@/lib/wallet/kit";
import type { StellarWalletType } from "@/lib/wallet/types";
import { WALLET_CONNECT_WALLET } from "@/lib/wallet/types";

function walletConnectConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim());
}

export function isStellarWalletAvailable(walletType: StellarWalletType): boolean {
  if (walletType === WALLET_CONNECT_WALLET) {
    return walletConnectConfigured();
  }
  return true;
}

export async function connectStellarWallet(walletType: StellarWalletType): Promise<string> {
  if (!isStellarWalletAvailable(walletType)) {
    throw new Error(
      "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
    );
  }

  await ensureKitInitialized();
  StellarWalletsKit.setWallet(walletType);
  const { address } = await StellarWalletsKit.fetchAddress();

  if (!address) {
    throw new Error("No public key returned from the selected wallet.");
  }

  return address;
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
