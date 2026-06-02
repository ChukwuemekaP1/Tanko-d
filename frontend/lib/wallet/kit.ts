"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks, type ModuleInterface } from "@creit.tech/stellar-wallets-kit/types";

let initialized = false;

export function getStellarNetwork(): Networks {
  const net =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK ||
    process.env.STELLAR_NETWORK ||
    "testnet";
  if (net === "public" || net === "mainnet") {
    return Networks.PUBLIC;
  }
  return Networks.TESTNET;
}

export function getNetworkPassphrase(): string {
  return (
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
    process.env.STELLAR_NETWORK_PASSPHRASE ||
    Networks.TESTNET
  );
}

export async function ensureKitInitialized(): Promise<void> {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const { FreighterModule } = await import(
    "@creit.tech/stellar-wallets-kit/modules/freighter"
  );
  const { AlbedoModule } = await import(
    "@creit.tech/stellar-wallets-kit/modules/albedo"
  );

  const modules: ModuleInterface[] = [
    new FreighterModule(),
    new AlbedoModule(),
  ];

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (projectId) {
    const { WalletConnectModule, WalletConnectTargetChain } = await import(
      "@creit.tech/stellar-wallets-kit/modules/wallet-connect"
    );
    const origin = window.location.origin;
    modules.push(
      new WalletConnectModule({
        projectId,
        metadata: {
          name: "Tanko",
          description: "Fleet fuel management on Stellar",
          url: origin,
          icons: [`${origin}/icon.svg`],
        },
        allowedChains: [WalletConnectTargetChain.TESTNET],
      }),
    );
  }

  StellarWalletsKit.init({
    modules,
    network: getStellarNetwork(),
  });

  initialized = true;
}

export function isKitInitialized(): boolean {
  return initialized;
}
