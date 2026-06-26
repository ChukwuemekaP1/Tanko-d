/** Wallet module ids used by @creit.tech/stellar-wallets-kit (avoid importing kit modules here — SSR breaks). */
export type WalletType = "freighter" | "albedo" | "wallet_connect";

export const FREIGHTER_WALLET: WalletType = "freighter";
export const ALBEDO_WALLET: WalletType = "albedo";
export const WALLET_CONNECT_WALLET: WalletType = "wallet_connect";

export interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  iconUrl: string;
  installUrl?: string;
  requiresProjectId?: boolean;
}

export const WALLET_OPTIONS: WalletOption[] = [
  {
    id: FREIGHTER_WALLET,
    name: "Freighter",
    description: "Extensión de navegador para Stellar",
    iconUrl: "https://stellar.creit.tech/wallet-icons/freighter.png",
    installUrl: "https://freighter.app",
  },
  {
    id: ALBEDO_WALLET,
    name: "Albedo",
    description: "Wallet web (sin extensión)",
    iconUrl: "https://stellar.creit.tech/wallet-icons/albedo.png",
    installUrl: "https://albedo.link",
  },
  {
    id: WALLET_CONNECT_WALLET,
    name: "WalletConnect",
    description: "Wallets móviles vía QR",
    iconUrl: "https://stellar.creit.tech/wallet-icons/walletconnect.png",
    requiresProjectId: true,
  },
];

export const STORAGE_KEYS = {
  ADDRESS: "tanko_stellar_address",
  WALLET_TYPE: "tanko_wallet_type",
  ROLE: "tanko_user_role",
  USER_ID: "tanko_user_id",
} as const;
