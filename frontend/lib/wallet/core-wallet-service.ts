"use client";

export interface Eip1193Provider {
  request<T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    avalanche?: Eip1193Provider;
  }
}

export const CORE_INSTALL_URL = "https://core.app/download";

export const AVALANCHE_C_CHAIN = {
  mainnet: {
    chainId: "0xa86a",
    decimalChainId: 43114,
    name: "Avalanche C-Chain",
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  },
  fuji: {
    chainId: "0xa869",
    decimalChainId: 43113,
    name: "Avalanche Fuji Testnet",
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://testnet.snowtrace.io"],
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  },
} as const;

export type AvalancheNetworkKey = keyof typeof AVALANCHE_C_CHAIN;

export interface CoreWalletSession {
  address: string;
  chainId: string;
  networkKey: AvalancheNetworkKey | "unsupported";
  networkLabel: string;
}

function normalizeChainId(chainId: string | number): string {
  if (typeof chainId === "number") {
    return `0x${chainId.toString(16)}`;
  }
  return chainId.toLowerCase();
}

export function normalizeAvalancheAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isAvalancheAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function getCoreProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.avalanche ?? null;
}

export function isCoreWalletInstalled(): boolean {
  return Boolean(getCoreProvider());
}

export function getAvalancheNetwork(chainId: string | number): CoreWalletSession["networkKey"] {
  const normalized = normalizeChainId(chainId);
  if (normalized === AVALANCHE_C_CHAIN.mainnet.chainId) {
    return "mainnet";
  }
  if (normalized === AVALANCHE_C_CHAIN.fuji.chainId) {
    return "fuji";
  }
  return "unsupported";
}

export function getAvalancheNetworkLabel(chainId: string | number): string {
  const network = getAvalancheNetwork(chainId);
  if (network === "mainnet") {
    return "Avalanche C-Chain (Mainnet)";
  }
  if (network === "fuji") {
    return "Fuji Testnet";
  }
  return `Unsupported network (${normalizeChainId(chainId)})`;
}

function getTargetNetwork() {
  const configured = process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID;
  if (configured && normalizeChainId(configured) === AVALANCHE_C_CHAIN.mainnet.chainId) {
    return AVALANCHE_C_CHAIN.mainnet;
  }
  return AVALANCHE_C_CHAIN.fuji;
}

async function ensureAvalancheNetwork(provider: Eip1193Provider): Promise<string> {
  const currentChainId = await provider.request<string>({ method: "eth_chainId" });
  if (getAvalancheNetwork(currentChainId) !== "unsupported") {
    return normalizeChainId(currentChainId);
  }

  const target = getTargetNetwork();
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target.chainId }],
    });
  } catch (error) {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [target],
    });
  }

  return normalizeChainId(await provider.request<string>({ method: "eth_chainId" }));
}

export async function connectCoreWallet(): Promise<CoreWalletSession> {
  const provider = getCoreProvider();
  if (!provider) {
    throw new Error(`Core Wallet is not installed. Install it from ${CORE_INSTALL_URL} and reload this page.`);
  }

  const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
  const address = accounts?.[0];
  if (!address || !isAvalancheAddress(address)) {
    throw new Error("Core Wallet did not return a valid Avalanche C-Chain address.");
  }

  const chainId = await ensureAvalancheNetwork(provider);
  return {
    address: normalizeAvalancheAddress(address),
    chainId,
    networkKey: getAvalancheNetwork(chainId),
    networkLabel: getAvalancheNetworkLabel(chainId),
  };
}

export async function restoreCoreWalletSession(): Promise<CoreWalletSession | null> {
  const provider = getCoreProvider();
  if (!provider) {
    return null;
  }

  const accounts = await provider.request<string[]>({ method: "eth_accounts" });
  const address = accounts?.[0];
  if (!address || !isAvalancheAddress(address)) {
    return null;
  }

  const chainId = normalizeChainId(await provider.request<string>({ method: "eth_chainId" }));
  return {
    address: normalizeAvalancheAddress(address),
    chainId,
    networkKey: getAvalancheNetwork(chainId),
    networkLabel: getAvalancheNetworkLabel(chainId),
  };
}

