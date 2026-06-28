/** Wallet module ids used by @creit.tech/stellar-wallets-kit (avoid importing kit modules here — SSR breaks). */
export type WalletType = "freighter" | "albedo" | "wallet_connect";

/** Wallet module ids used by @creit.tech/stellar-wallets-kit */
export type StellarWalletType =
  | typeof FREIGHTER_ID
  | typeof ALBEDO_ID
  | typeof WALLET_CONNECT_ID;

export type AvalancheWalletType = "core";
export type WalletType = StellarWalletType | AvalancheWalletType;
export type WalletNetwork = "stellar" | "avalanche";

export const FREIGHTER_WALLET: WalletType = "freighter";
export const ALBEDO_WALLET: WalletType = "albedo";
export const WALLET_CONNECT_WALLET: WalletType = "wallet_connect";
export const CORE_WALLET: AvalancheWalletType = "core";
export interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  iconUrl: string;
  installUrl?: string;
  requiresProjectId?: boolean;
  network: WalletNetwork;
}

export const WALLET_OPTIONS: WalletOption[] = [
  {
    id: CORE_WALLET,
    name: "Core Wallet",
    description: "Official Avalanche wallet for C-Chain",
    iconUrl: "https://core.app/favicon.ico",
    installUrl: "https://core.app/download",
    network: "avalanche",
  },
  {
    id: FREIGHTER_WALLET,
    name: "Freighter",
    description: "Extensión de navegador para Stellar",
    iconUrl: "https://stellar.creit.tech/wallet-icons/freighter.png",
    installUrl: "https://freighter.app",
    network: "stellar",
  },
  {
    id: ALBEDO_WALLET,
    name: "Albedo",
    description: "Wallet web (sin extensión)",
    iconUrl: "https://stellar.creit.tech/wallet-icons/albedo.png",
    installUrl: "https://albedo.link",
    network: "stellar",
  },
  {
    id: WALLET_CONNECT_WALLET,
    name: "WalletConnect",
    description: "Wallets móviles vía QR",
    iconUrl: "https://stellar.creit.tech/wallet-icons/walletconnect.png",
    requiresProjectId: true,
    network: "stellar",
  },
];

export const STORAGE_KEYS = {
  ADDRESS: "tanko_wallet_address",
  WALLET_TYPE: "tanko_wallet_type",
  CHAIN_ID: "tanko_wallet_chain_id",
  ROLE: "tanko_user_role",
  USER_ID: "tanko_user_id",
} as const;
