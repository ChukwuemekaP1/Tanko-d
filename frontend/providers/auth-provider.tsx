"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  connectStellarWallet,
  disconnectStellarWallet,
  restoreStellarWalletSession,
  signWalletTransaction,
} from "@/lib/wallet/stellar-wallet-service";
import {
  connectCoreWallet,
  getAvalancheNetworkLabel,
  getCoreProvider,
  isAvalancheAddress,
  restoreCoreWalletSession,
  type CoreWalletSession,
} from "@/lib/wallet/core-wallet-service";
import {
  CORE_WALLET,
  STORAGE_KEYS,
  FREIGHTER_WALLET,
  type StellarWalletType,
  type WalletType,
} from "@/lib/wallet/types";

export type UserRole = "CONDUCTOR" | "JEFE" | null;

function parseStoredWalletType(raw: string | null): WalletType | null {
  if (
    raw === "freighter" ||
    raw === "albedo" ||
    raw === "wallet_connect" ||
    raw === "core"
  ) {
    return raw;
  }
  return null;
}

function walletLabel(walletType: WalletType | null): string {
  switch (walletType) {
    case "freighter":
      return "Freighter";
    case "albedo":
      return "Albedo";
    case "wallet_connect":
      return "WalletConnect";
    case "core":
      return "Core Wallet";
    default:
      return "Wallet";
  }
}

interface AuthState {
  address: string | null;
  walletType: WalletType | null;
  chainId: string | null;
  networkLabel: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  role: UserRole;
  userId: string | null;
}

interface AuthContextType extends AuthState {
  /** Unified alias for `address` (issue #31) */
  walletAddress: string | null;
  isAvalancheWallet: boolean;
  networkLabel: string | null;
  setRole: (role: UserRole) => void;
  setUserId: (id: string | null) => void;
  connectWithWallet: (walletType: WalletType) => Promise<void>;
  /** @deprecated Prefer connectWithWallet; defaults to Freighter */
  connect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  disconnect: () => Promise<void>;
  walletLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    address: null,
    walletType: null,
    chainId: null,
    networkLabel: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    role: null,
    userId: null,
  });

  const persistSession = useCallback(
    (address: string, walletType: WalletType, chainId?: string | null) => {
      localStorage.setItem(STORAGE_KEYS.ADDRESS, address);
      localStorage.setItem(STORAGE_KEYS.WALLET_TYPE, walletType);
      if (chainId) {
        localStorage.setItem(STORAGE_KEYS.CHAIN_ID, chainId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CHAIN_ID);
      }
    },
    [],
  );

  const clearWalletSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.WALLET_TYPE);
    localStorage.removeItem(STORAGE_KEYS.CHAIN_ID);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }, []);

  const persistBackendWalletConnection = useCallback(
    async (address: string, walletType: WalletType, chainId?: string | null) => {
      try {
        await fetch("/api/wallet/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey: walletType === CORE_WALLET ? undefined : address,
            avalancheAddress: walletType === CORE_WALLET ? address : undefined,
            walletType,
            chainId,
          }),
        });
      } catch (err) {
        console.warn("[Tanko] Wallet backend persistence skipped:", err);
      }
    },
    [],
  );

  useEffect(() => {
    async function restore() {
      const storedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS);
      const storedWalletType = parseStoredWalletType(
        localStorage.getItem(STORAGE_KEYS.WALLET_TYPE),
      );
      const storedChainId = localStorage.getItem(STORAGE_KEYS.CHAIN_ID);
      const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole;
      const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!storedAddress) {
        return;
      }

      if (storedWalletType === CORE_WALLET) {
        const session = await restoreCoreWalletSession();
        if (session) {
          persistSession(session.address, CORE_WALLET, session.chainId);
          setState({
            address: session.address,
            walletType: CORE_WALLET,
            chainId: session.chainId,
            networkLabel: session.networkLabel,
            isConnected: true,
            isConnecting: false,
            error: null,
            role: storedRole,
            userId: storedUserId,
          });
          return;
        }
      } else if (storedWalletType) {
        const liveAddress = await restoreStellarWalletSession(storedWalletType as StellarWalletType);
        if (liveAddress) {
          persistSession(liveAddress, storedWalletType);
          setState({
            address: liveAddress,
            walletType: storedWalletType,
            chainId: null,
            networkLabel: "Stellar Testnet",
            isConnected: true,
            isConnecting: false,
            error: null,
            role: storedRole,
            userId: storedUserId,
          });
          return;
        }
      }

      // Fallback: show last known address until user reconnects or disconnects
      setState({
        address: storedAddress,
        walletType: storedWalletType,
        chainId: storedChainId,
        networkLabel:
          storedWalletType === CORE_WALLET && storedChainId
            ? getAvalancheNetworkLabel(storedChainId)
            : storedWalletType
              ? "Stellar Testnet"
              : null,
        isConnected: true,
        isConnecting: false,
        error: null,
        role: storedRole,
        userId: storedUserId,
      });
    }

    restore().catch((err) => {
      console.error("[Tanko] Wallet restore error:", err);
    });
  }, [persistSession]);

  const connectWithWallet = useCallback(
    async (walletType: WalletType) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      try {
        let address: string;
        let chainId: string | null = null;
        let networkLabel = "Stellar Testnet";

        if (walletType === CORE_WALLET) {
          const session: CoreWalletSession = await connectCoreWallet();
          address = session.address;
          chainId = session.chainId;
          networkLabel = session.networkLabel;
        } else {
          address = await connectStellarWallet(walletType as StellarWalletType);
        }

        persistSession(address, walletType, chainId);
        void persistBackendWalletConnection(address, walletType, chainId);
        setState((prev) => ({
          ...prev,
          address,
          walletType,
          chainId,
          networkLabel,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
        console.log(
          `[Tanko] ✅ ${walletLabel(walletType)} connected: ${address}`,
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not connect. Unlock your wallet and try again.";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: message,
        }));
      }
    },
    [persistBackendWalletConnection, persistSession],
  );

  const connect = useCallback(async () => {
    await connectWithWallet(FREIGHTER_WALLET);
  }, [connectWithWallet]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!state.address) {
        throw new Error("No wallet connected.");
      }
      if (state.walletType === CORE_WALLET) {
        throw new Error("Core Wallet cannot sign Stellar XDR transactions.");
      }
      try {
        return await signWalletTransaction(xdr, state.address);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Transaction signing failed.";
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [state.address, state.walletType],
  );

  const disconnect = useCallback(async () => {
    if (state.walletType !== CORE_WALLET) {
      await disconnectStellarWallet();
    }
    clearWalletSession();
    setState({
      address: null,
      walletType: null,
      chainId: null,
      networkLabel: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      role: null,
      userId: null,
    });
    console.log("[Tanko] Wallet disconnected");
    if (typeof window !== "undefined") {
      window.location.href = "/connect";
    }
  }, [clearWalletSession, state.walletType]);

  useEffect(() => {
    const provider = getCoreProvider();
    if (!provider?.on) {
      return;
    }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];
      const nextAddress = accounts[0];
      if (!nextAddress) {
        void disconnect();
        return;
      }
      if (!isAvalancheAddress(nextAddress)) {
        return;
      }
      const normalized = nextAddress.toLowerCase();
      setState((prev) => {
        if (prev.walletType !== CORE_WALLET) {
          return prev;
        }
        persistSession(normalized, CORE_WALLET, prev.chainId);
        void persistBackendWalletConnection(normalized, CORE_WALLET, prev.chainId);
        return { ...prev, address: normalized, isConnected: true };
      });
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = typeof args[0] === "string" ? args[0].toLowerCase() : null;
      if (!chainId) {
        return;
      }
      setState((prev) => {
        if (prev.walletType !== CORE_WALLET || !prev.address) {
          return prev;
        }
        persistSession(prev.address, CORE_WALLET, chainId);
        void persistBackendWalletConnection(prev.address, CORE_WALLET, chainId);
        return { ...prev, chainId, networkLabel: getAvalancheNetworkLabel(chainId) };
      });
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [disconnect, persistBackendWalletConnection, persistSession]);

  const setRole = useCallback((role: UserRole) => {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
    setState((prev) => ({ ...prev, role }));
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    }
    setState((prev) => ({ ...prev, userId }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        walletAddress: state.address,
        isAvalancheWallet: state.walletType === CORE_WALLET,
        networkLabel: state.networkLabel,
        connectWithWallet,
        connect,
        signTransaction,
        disconnect,
        setRole,
        setUserId,
        walletLabel: walletLabel(state.walletType),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
