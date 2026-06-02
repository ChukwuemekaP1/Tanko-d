import { ALBEDO_ID } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { WALLET_CONNECT_ID } from "@creit.tech/stellar-wallets-kit/modules/wallet-connect";

/** Wallet module ids used by @creit.tech/stellar-wallets-kit */
export type WalletType = typeof FREIGHTER_ID | typeof ALBEDO_ID | typeof WALLET_CONNECT_ID;

export const FREIGHTER_WALLET = FREIGHTER_ID as WalletType;
export const ALBEDO_WALLET = ALBEDO_ID as WalletType;
export const WALLET_CONNECT_WALLET = WALLET_CONNECT_ID as WalletType;

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
    description: "Browser extension for Stellar",
    iconUrl: "https://stellar.creit.tech/wallet-icons/freighter.png",
    installUrl: "https://freighter.app",
  },
  {
    id: ALBEDO_WALLET,
    name: "Albedo",
    description: "Web-based Stellar signer",
    iconUrl: "https://stellar.creit.tech/wallet-icons/albedo.png",
    installUrl: "https://albedo.link",
  },
  {
    id: WALLET_CONNECT_WALLET,
    name: "WalletConnect",
    description: "Mobile wallets via QR or deep link",
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
